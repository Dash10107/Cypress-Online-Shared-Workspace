import Stripe from 'stripe';
import { Price, Product, Subscription } from '../supabase/supabase.type';
import db from '../supabase/db';
import {
  customers,
  prices,
  products,
  subscriptions,
  users,
} from '../../../migrations/schema';
import { stripe } from './index';
import { eq } from 'drizzle-orm';
import { toDateTime } from '../utils';

export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };
  try {
    await db
      .insert(products)
      .values(productData)
      .onConflictDoUpdate({ target: products.id, set: productData });
  } catch (error) {
    throw new Error();
  }
  console.log('Product inserted/updates:', product.id);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  console.log(price, 'PRICE');
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };
  try {
    await db
      .insert(prices)
      .values(priceData)
      .onConflictDoUpdate({ target: prices.id, set: priceData });
  } catch (error) {
    throw new Error(`Could not insert/update the price ${error}`);
  }
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  try {
    const response = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.id, uuid),
    });
    if (!response) throw new Error();
    return response.stripe_customer_id;
  } catch (error) {
    const customerData: { metadata: { supabaseUUID: string }; email?: string } =
      {
        metadata: {
          supabaseUUID: uuid,
        },
      };
    if (email) customerData.email = email;
    try {
      const customer = await stripe.customers.create(customerData);
      await db
        .insert(customers)
        .values({ id: uuid, stripe_customer_id: customer.id });
      console.log(`New customer created and inserted for ${uuid}.`);
      return customer.id;
    } catch (stripeError) {
      throw new Error('Could not create Customer or find the customer');
    }
  }
};

export const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  try {
    await db
      .update(users)
      .set({
        billing_address: { ...address },
        payment_method: { ...payment_method[payment_method.type] },
      })
      .where(eq(users.id, uuid));
  } catch (error) {
    throw new Error('Couldnot copy customer billing details');
  }
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  try {
    const customerData = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.stripe_customer_id, customerId),
    });
    if (!customerData) throw new Error('🔴Cannot find the customer');
    const { id: uuid } = customerData;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });
    console.log('🟢UPDATED to  ',subscription.status);

    const subscriptionData: Subscription = {
      id: subscription.id,
      user_id: uuid,
      metadata: subscription.metadata,
      //@ts-ignore
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      //@ts-ignore
      quantity: subscription.quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : null,
      current_period_start: toDateTime(
        subscription.current_period_start
      ).toISOString(),
      current_period_end: toDateTime(
        subscription.current_period_end
      ).toISOString(),
      ended_at: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : null,
    };
    await db
      .insert(subscriptions)
      .values(subscriptionData)
      .onConflictDoUpdate({ target: subscriptions.id, set: subscriptionData });
    console.log(
      `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
    );
    if (createAction && subscription.default_payment_method && uuid) {
      await copyBillingDetailsToCustomer(
        uuid,
        subscription.default_payment_method as Stripe.PaymentMethod
      );
    }
  } catch (error) {
    throw error;
  }
};