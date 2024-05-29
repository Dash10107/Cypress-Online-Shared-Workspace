'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { useMemo, useState } from 'react'
import { useToast } from '../ui/use-toast';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useAppState } from '@/lib/providers/state-provider';
import { useRouter } from 'next/navigation';
import { AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import clsx from 'clsx';
import EmojiPicker from '../global/emoji-picker';
import { createFile, updateFile, updateFolder } from '@/lib/supabase/queries';
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon, Trash } from 'lucide-react';
import { v4 } from 'uuid';
import { File } from '@/lib/supabase/supabase.type';

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
      const handleDoubleClick = (e:any) => {
        e.preventDefault();
        e.stopPropagation();
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

  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    const fId = id.split('folder');
    if (fId?.length === 1) {
      if (!folderTitle) return;
      toast({
        title: 'Success',
        description: 'Folder title changed.',
      });
      await updateFolder({ title }, fId[0]);
    }

    if (fId.length === 2 && fId[1]) {
      if (!fileTitle) return;
      const { data, error } = await updateFile( { title: fileTitle }, fId[1]);
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not update the title for this file',
        });
      } else
        toast({
          title: 'Success',
          description: 'File title changed.',
        });
    }
  };

  const folderTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fid = id.split('folder');
    if (fid.length === 1) {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { title: e.target.value },
          folderId: fid[0],
          workspaceId,
        },
      });
    }
  };
  const fileTitleChange = (e: any) => {
    if (!workspaceId || !folderId) return;
    const fid = id.split('folder');
    if (fid.length === 2 && fid[1]) {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          file: { title: e.target.value },
          folderId,
          workspaceId,
          fileId: fid[1],
        },
      });
    }
  };

  const addNewFile = async () => {
    if (!workspaceId) return;
    const newFile: File = {
      folder_id: id,
      data: null,
      created_at: new Date().toISOString(),
      in_trash: null,
      title: 'Untitled File',
      icon_id: '📄',
      id: v4(),
      workspace_id:workspaceId,
      banner_url: '',
    };
    dispatch({
      type: 'ADD_FILE',
      payload: { file: newFile, folderId: id, workspaceId },
    });
    const { data, error } = await createFile(newFile);
    if (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Could not create a file',
      });
    } else {
      toast({
        title: 'Success',
        description: 'File created.',
      });
    }
  };

  //move to trash
  const moveToTrash = async () => {
    if (!user?.email || !workspaceId) return;
    const pathId = id.split('folder');
    if (listType === 'folder') {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { in_trash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
        },
      });
      const { data, error } = await updateFolder(
        { in_trash: `Deleted by ${user?.email}` },
        pathId[0]
      );
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not move the folder to trash',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Moved folder to trash',
        });
      }
    }

    if (listType === 'file') {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          file: { in_trash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
          fileId: pathId[1],
        },
      });
      const { data, error } = await updateFile(
        { in_trash: `Deleted by ${user?.email}` },
        pathId[1]
      );
      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Could not move the file to trash',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Moved file to trash',
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
            <div className='relative flex  gap-4 
          items-center 
          justify-center 
          overflow-hidden'>
            <EmojiPicker getValue={onChangeEmoji}>{iconId}</EmojiPicker>
            <input
              type="text"
              style={{
                userSelect: 'none', // Prevent text selection
                cursor: 'pointer', // Indicate clickable area
              }}
              value={listType === 'folder' ? folderTitle : fileTitle}
              className={clsx(
                'outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7',
                {
                  'bg-muted cursor-text': isEditing,
                  'bg-transparent cursor-pointer': !isEditing,
                }
              )}
              readOnly={!isEditing}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={
                listType === 'folder' ? folderTitleChange : fileTitleChange
              }
            />
            </div>
            <div className={hoverStyles}>
            <TooltipComponent message={listType==="folder"?"Delete Folder":"Delete File"}>
              <Trash
                onClick={moveToTrash}
                size={15}
                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
              />
            </TooltipComponent>
            {listType === 'folder' && !isEditing && (
              <TooltipComponent message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipComponent>
            )}
          </div>
          </div>
         </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.in_trash)
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            console.log(state.workspaces)
            return (
              <Dropdown
                key={file.id}
                title={file.title}
                listType="file"
                id={customFileId}
                iconId={file.icon_id}
              />
            );
          })}
      </AccordionContent>
  </AccordionItem>
  )
}

export default Dropdown
