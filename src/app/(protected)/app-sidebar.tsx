"use client"

import { Bot, CreditCard, LayoutDashboard, Plus, GitCommit, BookOpen, BrainCircuit } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "~/components/ui/sidebar"
import { cn } from "~/lib/utils"
import useProject from "~/hooks/use-project"
import { BrainLogo } from "~/components/brain-logo"

export function AppSidebar(){
    const router = useRouter();
    const pathname = usePathname();
    const {open} = useSidebar();
    const {projects, projectId, setProjectId}= useProject();
    const items=[{
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard
    },{
        title: "Ask & Explore",
        url: "/qa",
        icon: BrainCircuit
    },{
        title: "Commit Summaries",
        url: "/commit-summaries",
        icon: GitCommit
    },{
        title: "Knowledge Base",
        url: "/knowledge-base",
        icon: BookOpen
    },{
        title: "Usage & Billing",
        url: "/billing",
        icon: CreditCard
    }
]

    return (
        <Sidebar collapsible="icon" variant="floating" >
            <SidebarHeader>
                <div className="flex items-center gap-2.5 px-1 py-1">
                    <BrainLogo size={30} glow={true} />
                    {open && (
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent">
                                RepoMind
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wide">
                                Code Intelligence
                            </span>
                        </div>
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                 
                    <SidebarGroupContent>
                        <SidebarMenu> 

                            {items.map((item)=>{
                                return(
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className={cn({
                                                '!bg-primary !text-white': pathname === item.url
                                            })}>
                                                <item.icon className="size-4"/>
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                            
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>
                        Your Projects
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu> 

                            {projects?.map((project)=>{
                                return(
                                    <SidebarMenuItem key={project.name}>
                                        <SidebarMenuButton asChild>
                                            <div onClick={()=>{
                                                setProjectId(project.id);
                                                if (pathname !== '/dashboard') {
                                                    router.push('/dashboard');
                                                }
                                            }} className={cn("cursor-pointer", {
                                                "bg-primary/20": project.id === projectId
                                            })}>
                                                <div className={cn(
                                                    'rounded-sm border size-6 -ml-1 flex items-center justify-center text-sm bg-white text-primary',
                                                    {
                                                        'bg-primary text-white': project.id === projectId
                                                    }
                                                )}>
                                                    <span className="p-3">{project.name[0]}</span>
                                                </div>
                                                    <span>{project.name}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                            <div className="h-2"></div>
                           { open && <SidebarMenuItem>
                                <Link href={'/create'}>
                                    <Button size={"sm"} variant="outline" className="w-fit px-2 gap-1.5">
                                        <Plus className="size-4"/>
                                       Create Project
                                    </Button>
                                </Link>
                            </SidebarMenuItem>}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                
            </SidebarContent>
        </Sidebar>
    )
}
