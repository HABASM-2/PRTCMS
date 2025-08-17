// app/proposals/components/TabsContainer.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubmitProposalForm from "./SubmitProposalForm";
import MySubmissions from "./MySubmissions";
import ViewProposals from "./ViewProposals";
import StatusProposals from "./StatusProposals";
import ReviewProposals from "./ReviewProposals";
import { auth } from "@/lib/auth";

export default async function TabsContainer() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles = session?.user?.roles || [];

  // Normalize role names
  const roleNames = roles.map((r: string) => r.toLowerCase());

  // Role-based access
  const canSubmitProposal = roleNames.includes("user"); // ✅ Only "user" role can submit

  // Default tab logic
  let defaultTab = "view";
  if (canSubmitProposal) {
    defaultTab = "submit";
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        {canSubmitProposal && (
          <TabsTrigger value="submit">Submit Proposal</TabsTrigger>
        )}
        <TabsTrigger value="view">View Proposals</TabsTrigger>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="review">Review Proposals</TabsTrigger>
      </TabsList>

      {canSubmitProposal && (
        <TabsContent value="submit">
          {/* Nested tabs inside Submit */}
          <Tabs defaultValue="new" className="mb-6">
            <TabsList>
              <TabsTrigger value="new">New Submission</TabsTrigger>
              <TabsTrigger value="my">My Submissions</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <SubmitProposalForm userId={Number(userId)} />
            </TabsContent>
            <TabsContent value="my">
              <MySubmissions userId={Number(userId)} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}

      <TabsContent value="view">
        <ViewProposals userId={Number(userId)} />
      </TabsContent>

      <TabsContent value="status">
        <StatusProposals />
      </TabsContent>

      <TabsContent value="review">
        <ReviewProposals userId={Number(userId)} />
      </TabsContent>
    </Tabs>
  );
}
