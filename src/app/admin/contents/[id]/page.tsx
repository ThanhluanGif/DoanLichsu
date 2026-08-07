import { ContentEditorPage } from "@/components/admin/ContentEditor";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ContentEditorPage id={id}/>;}
