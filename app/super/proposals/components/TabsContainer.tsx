import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubmitProposalForm from "./SubmitProposalForm";
import ViewProposals from "./ViewProposals";
import { auth } from "@/lib/auth";

export default async function TabsContainer() {
  const session = await auth();
  const userId = session?.user?.id;
  return (
    <Tabs defaultValue="submit" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="submit">Submit Proposal</TabsTrigger>
        <TabsTrigger value="view">View Proposals</TabsTrigger>
      </TabsList>

      <TabsContent value="submit">
        <SubmitProposalForm userId={Number(userId)} />
      </TabsContent>

      <TabsContent value="view">
        <ViewProposals userId={Number(userId)} />
      </TabsContent>
    </Tabs>
  );
}
