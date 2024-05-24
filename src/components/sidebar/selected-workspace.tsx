'use client';
import { workspace } from '@/lib/supabase/supabase.type';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

const SelectedWorkspace = ({ workspace,
    onClick,}:{ workspace: workspace;
    onClick?: (option: workspace) => void;}) => {
        const supabase = createClientComponentClient();
        const [workspaceLogo, setWorkspaceLogo] = useState('/cypresslogo.svg');
        useEffect(() => {
          const fetchWorkspaceLogo = async () => {
            if (workspace.logo) {
              const { data } =  supabase
                .storage
                .from('workspace-logos')
                .getPublicUrl(workspace.logo);
      
              if (data) {
                setWorkspaceLogo(data.publicUrl);
              }
            }
          };
      
          fetchWorkspaceLogo();
        }, [workspace]);


  return (
 <Link
      href={`/dashboard/${workspace.id}`}
      onClick={() => {
        if (onClick) onClick(workspace);
      }}
      className="flex 
      rounded-md 
      hover:bg-muted 
      transition-all 
      flex-row 
      p-2 
      gap-4 
      justify-center 
      cursor-pointer 
      items-center 
      my-2"
    >
      <Image
        src={workspaceLogo}
        alt="workspace logo"
        width={26}
        height={26}
        objectFit="cover"
      />
      <div className="flex flex-col">
        <p
          className="text-lg 
        w-[170px] 
        overflow-hidden 
        overflow-ellipsis 
        whitespace-nowrap"
        >
          {workspace.title}
        </p>
      </div>
    </Link>
  )
}

export default SelectedWorkspace
