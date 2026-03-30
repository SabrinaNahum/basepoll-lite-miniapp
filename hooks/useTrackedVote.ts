"use client";

import { Attribution } from "ox/erc8021";
import type { Address, Hash } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { basePollLiteContract } from "@/lib/contracts";
import { trackTransaction } from "@/utils/track";

const BUILDER_CODE = "bc_ckvrsfca";
const BUILDER_DATA_SUFFIX_ENCODED =
  "0x62635f636b7672736663610b0080218021802180218021802180218021";
// 这里替换为真实 Builder Code
export const DATA_SUFFIX = (() => {
  try {
    const computed = Attribution.toDataSuffix({
      codes: [BUILDER_CODE]
    });
    return computed || BUILDER_DATA_SUFFIX_ENCODED;
  } catch {
    return BUILDER_DATA_SUFFIX_ENCODED;
  }
})();

export function useTrackedVote() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const voteTracked = async (
    chooseA: boolean,
    userAddress?: Address
  ): Promise<Hash> => {
    const txHash = await writeContractAsync({
      ...basePollLiteContract,
      functionName: "vote",
      args: [chooseA],
      dataSuffix: DATA_SUFFIX
    });

    void trackTransaction(
      "app-007",
      "BasePoll Lite",
      userAddress ?? address,
      txHash
    );

    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted");
      }
    }

    return txHash;
  };

  return {
    voteTracked,
    isPending
  };
}
