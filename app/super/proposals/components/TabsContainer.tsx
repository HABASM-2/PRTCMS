// app/proposals/components/TabsContainer.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubmitProposalForm from "./SubmitProposalForm";
import MySubmissions from "./MySubmissions";
import ViewProposals from "./ViewProposals";
import StatusProposals from "./StatusProposals";
import ReviewProposals from "./ReviewProposals";
import FinalizedProposals from "./FinalizedProposals"; // <-- New component
import GrantingProposal from "./GrantingProposal"; // <-- New component
import { auth } from "@/lib/auth";

export default async function TabsContainer() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles = session?.user?.roles || [];

  // Normalize role names
  const roleNames = roles.map((r: string) => r.toLowerCase());

  // Role-based access
  const canSubmitProposal = roleNames.includes("user"); // ✅ Only "user" role can submit
  const canViewStatus = roleNames.includes("coordinator"); // Status tab
  const canViewProposal = roleNames.includes("head");
  const canViewFinalized = roleNames.includes("coordinator"); // Only coordinators can see finalized proposals
  const canViewGoN = roleNames.includes("director");

  // Default tab logic
  let defaultTab = "view";
  if (canSubmitProposal) defaultTab = "submit";
  else if (canViewStatus) defaultTab = "status";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        {canSubmitProposal && (
          <TabsTrigger value="submit">Submit Proposal</TabsTrigger>
        )}
        {canViewProposal && (
          <TabsTrigger value="view">View Proposals</TabsTrigger>
        )}
        {canViewStatus && <TabsTrigger value="status">Status</TabsTrigger>}
        {canViewFinalized && (
          <TabsTrigger value="finalized">Finalized</TabsTrigger>
        )}
        {canViewGoN && <TabsTrigger value="granting">Granter</TabsTrigger>}
        <TabsTrigger value="review">Review Proposals</TabsTrigger>
      </TabsList>

      {canSubmitProposal && (
        <TabsContent value="submit">
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

      {canViewProposal && (
        <TabsContent value="view">
          <ViewProposals userId={Number(userId)} />
        </TabsContent>
      )}

      {canViewStatus && (
        <TabsContent value="status">
          <StatusProposals userId={Number(userId)} roles={roles} />
        </TabsContent>
      )}

      {canViewFinalized && (
        <TabsContent value="finalized">
          <FinalizedProposals userId={Number(userId)} roles={roles} />
        </TabsContent>
      )}

      {canViewGoN && (
        <TabsContent value="granting">
          <GrantingProposal userId={Number(userId)} roles={roles} />
        </TabsContent>
      )}

      <TabsContent value="review">
        <ReviewProposals userId={Number(userId)} />
      </TabsContent>
    </Tabs>
  );
}
