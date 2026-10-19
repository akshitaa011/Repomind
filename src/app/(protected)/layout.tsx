import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { ModeToggle } from '../components/ThemeToggle'

type Props = {
    children: React.ReactNode
}
const userButtonAppearance = {
    elements: {
      userButtonAvatarBox: "w-9 h-9", // Custom width and height
      userButtonPopoverCard: "w-auto", // Custom background for the popover card
    //   userButtonPopoverActionButton: "text-blue-400", // Custom text color for action buttons
    },
  };
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = clerkKey && clerkKey.startsWith("pk_") && !clerkKey.includes("...");

const SideBarLayout = ({children}:Props) => {
  return (
    <SidebarProvider>
        {/* <AppSidebar /> */}
        <AppSidebar/>
        <main className='w-full m-2 '>
            <div className='flex items-center gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4'>
                <SidebarTrigger />
                {/* <SearchBar/> */}
                <div className="ml-auto"></div>
                <ModeToggle/>
                {hasValidClerkKey ? (
                    <UserButton appearance={userButtonAppearance}/>
                ) : (
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        RM
                    </div>
                )}
            </div>
            <div className="h-4"></div>
            {/* main content */}
            <div className='border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-4'>
                {children}
            </div>
        </main>
    </SidebarProvider>
  )
}

export default SideBarLayout