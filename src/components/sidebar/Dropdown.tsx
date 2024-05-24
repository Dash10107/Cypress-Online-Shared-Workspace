'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useMemo, useState } from 'react'
import { useToast } from '../ui/use-toast';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useAppState } from '@/lib/providers/state-provider';
import { useRouter } from 'next/navigation';
import { AccordionItem, AccordionTrigger } from '../ui/accordion';
import clsx from 'clsx';
import EmojiPicker from '../global/emoji-picker';
import { updateFolder } from '@/lib/supabase/queries';

interface DropdownProps {
    title: string;
    id: string;
    listType: 'folder' | 'file';
    iconId: string;
    children?: React.ReactNode;
    disabled?: boolean;
  }
  
  const Dropdown: React.FC<DropdownProps> = ({
    title,
    id,
    listType,
    iconId,
    children,
    disabled,
    ...props
  }) => {
    const supabase = createClientComponentClient();
    const { toast } = useToast();
    const { user } = useSupabaseUser();
    const { state, dispatch, workspaceId, folderId } = useAppState();
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    const folderTitle: string | undefined = useMemo(() => {
        if (listType === 'folder') {
          const stateTitle = state.workspaces
            .find((workspace) => workspace.id === workspaceId)
            ?.folders.find((folder) => folder.id === id)?.title;
          if (title === stateTitle || !stateTitle) return title;
          return stateTitle;
        }
      }, [state, listType, workspaceId, id, title]);

      const fileTitle: string | undefined = useMemo(() => {
        if (listType === 'file') {
          const fileAndFolderId = id.split('folder');
          const stateTitle = state.workspaces
            .find((workspace) => workspace.id === workspaceId)
            ?.folders.find((folder) => folder.id === fileAndFolderId[0])
            ?.files.find((file) => file.id === fileAndFolderId[1])?.title;
          if (title === stateTitle || !stateTitle) return title;
          return stateTitle;
        }
      }, [state, listType, workspaceId, id, title]);

      const navigatatePage = (accordionId: string, type: string) => {
        if (type === 'folder') {
          router.push(`/dashboard/${workspaceId}/${accordionId}`);
        }
        if (type === 'file') {
          router.push(
            `/dashboard/${workspaceId}/${folderId}/${
              accordionId.split('folder')[1]
            }`
          );
        }
      }
        
      //double click handler
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const isFolder = listType === 'folder';
  const groupIdentifies = clsx(
    'dark:text-white whitespace-nowrap flex justify-between items-center w-full relative',
    {
      'group/folder': isFolder,
      'group/file': !isFolder,
    }
  );
  const listStyles = useMemo(
    () =>
      clsx('relative', {
        'border-none text-md': isFolder,
        'border-none ml-6 text-[16px] py-1': !isFolder,
      }),
    [isFolder]
  );

  const hoverStyles = useMemo(
    () =>
      clsx(
        'h-full hidden rounded-sm absolute right-0 items-center justify-center',
        {
          'group-hover/file:block': listType === 'file',
          'group-hover/folder:block': listType === 'folder',
        }
      ),
    [isFolder]
  );

  const onChangeEmoji = async (selectedEmoji: string) => {
    if (!workspaceId) return;
    if (listType === 'folder') {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          workspaceId,
          folderId: id,
          folder: { icon_id: selectedEmoji },
        },
      });
      const { data, error } = await updateFolder({ icon_id: selectedEmoji }, id);
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not update the emoji for this folder',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Update emoji for the folder',
        });
      }
    }
  };

  return (
    <AccordionItem
    value={id}
     className={listStyles}
    onClick={(e) => {
      e.stopPropagation();
      navigatatePage(id, listType);
    }}
  >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline 
        p-2 
        dark:text-muted-foreground 
        text-sm"
        disabled={listType === 'file'}
      >
         <div className={groupIdentifies}>
         <div
            className="flex 
          gap-4 
          items-center 
          justify-center 
          overflow-hidden"
          >
            <div className='relative'>
            <EmojiPicker getValue={onChangeEmojiHandler}>{iconId}</EmojiPicker>
            </div>
          </div>
         </div>
      </AccordionTrigger>
  </AccordionItem>
  )
}

export default Dropdown
