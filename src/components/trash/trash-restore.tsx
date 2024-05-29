'use client';
import { appFoldersType, useAppState } from '@/lib/providers/state-provider';
import { File } from '@/lib/supabase/supabase.type';
import { ArchiveRestoreIcon, FileIcon, FolderIcon, Trash } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import TooltipComponent from '../global/tooltip-component';
import clsx from 'clsx';
import { deleteFile, deleteFolder, updateFile, updateFolder } from '@/lib/supabase/queries';
import { useRouter } from 'next/navigation';
import { useToast } from '../ui/use-toast';


const TrashRestore = () => {
  const { state, workspaceId } = useAppState();
  const { toast } = useToast();
  const [folders, setFolders] = useState<appFoldersType[] | []>([]);
  const [files, setFiles] = useState<File[] | []>([]);
  const router = useRouter();
  const {  dispatch } = useAppState();
  const restoreFileHandler = async (dirType:string,fileId:string ,folderId:string,workspaceId:string ) => {
    if (dirType === 'file') {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: 'UPDATE_FILE',
        payload: { file: { in_trash: '' }, fileId, folderId, workspaceId },
      });
      await updateFile({ in_trash: '' }, fileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      toast({
        title: 'Success',
        description: 'Restored File Successfully',
      });
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: { folder: { in_trash: '' }, folderId, workspaceId },
      });
      await updateFolder({ in_trash: '' }, folderId);
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
      toast({
        title: 'Success',
        description: 'Restored Folder Successfully',
      });
    
    }
  };

  const deleteFileHandler = async (dirType:string,fileId:string ,folderId:string,workspaceId:string ) => {
    if (dirType === 'file') {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: 'DELETE_FILE',
        payload: { fileId, folderId, workspaceId },
      });
      await deleteFile(fileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      toast({
        title: 'Success',
        description: 'Deleted File Successfully',
      });
    }
    if (dirType === 'folder') {
      if (!workspaceId) return;
      dispatch({
        type: 'DELETE_FOLDER',
        payload: { folderId: fileId, workspaceId },
      });
      await deleteFolder(folderId);
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
      toast({
        title: 'Success',
        description: 'Deleted Folder Successfully',
      });
      
    }
  };

  useEffect(() => {
    const stateFolders =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.filter((folder) => folder.in_trash) || [];
    setFolders(stateFolders);

    let stateFiles: File[] = [];
    state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.forEach((folder) => {
        folder.files.forEach((file) => {
          if (file.in_trash) {
            stateFiles.push(file);
          }
        });
      });
    setFiles(stateFiles);
  }, [state, workspaceId]);

  return (
    <section>
      {!!folders.length && (
        <>
          <h3>Folders</h3>
          {folders.map((folder) => (
             <div key={folder.id} className="relative group">
            <Link
              className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
              href={`/dashboard/${folder.workspace_id}/${folder.id}`}
            >
              <article>
                <aside className="flex items-center gap-2">
                  <FolderIcon />
                  {folder.title}
                </aside>
              </article>
            
            </Link>
            <div className= {clsx(
                  'absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pr-2',
                  'hidden group-hover:flex'
                )}>
            <TooltipComponent message="Delete Folder">
              <Trash
                onClick={(e)=>{ e.preventDefault();e.stopPropagation(); deleteFileHandler("folder","",folder.id,folder.workspace_id)}}
                size={15}
                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
              />
            </TooltipComponent>
            
              <TooltipComponent message="Restore Folder">
                <ArchiveRestoreIcon
                  onClick={(e)=>{e.preventDefault();e.stopPropagation(); restoreFileHandler("folder","",folder.id,folder.workspace_id)}}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipComponent>
        
          </div>
            </div>
          ))}
        </>
      )}
      {!!files.length && (
        <>
          <h3>Files</h3>
          {files.map((file) => (
            <div key={file.id} className="relative group">
            <Link
              key={file.id}
              className=" hover:bg-muted rounded-md p-2 flex items-center justify-between"
              href={`/dashboard/${file.workspace_id}/${file.folder_id}/${file.id}`}
            >
              <article>
                <aside className="flex items-center gap-2">
                  <FileIcon />
                  {file.title}
                </aside>
              </article>
            </Link>
                        <div className= {clsx(
                          'absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pr-2',
                          'hidden group-hover:flex'
                        )}>
                    <TooltipComponent message="Delete File">
                      <Trash
                        onClick={(e)=>{ e.preventDefault();e.stopPropagation(); deleteFileHandler("file",file.id,file.folder_id,file.workspace_id)}}
                        size={15}
                        className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                      />
                    </TooltipComponent>
                    
                      <TooltipComponent message="Restore File">
                        <ArchiveRestoreIcon
                          onClick={(e)=>{e.preventDefault();e.stopPropagation(); restoreFileHandler("file",file.id,file.folder_id,file.workspace_id)}}
                          size={15}
                          className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                        />
                      </TooltipComponent>
                
                  </div>
                    </div>
          ))}
        </>
      )}
      {!files.length && !folders.length && (
        <div
          className="
          text-muted-foreground
          absolute
          top-[50%]
          left-[50%]
          transform
          -translate-x-1/2
          -translate-y-1/2

      "
        >
          No Items in trash
        </div>
      )}
    </section>
  );
};

export default TrashRestore;