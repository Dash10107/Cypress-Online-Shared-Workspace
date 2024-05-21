import React from 'react'



const Layout =  ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex over-hidden h-screen">
      {/* <SubscriptionModalProvider products={products}>
        {children}
      </SubscriptionModalProvider> */}
      {children}
    </main>
  )
}

export default Layout
