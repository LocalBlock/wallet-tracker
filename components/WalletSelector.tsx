import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuGroup,
  MenuItem,
} from "@chakra-ui/react";
import { useRef } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa6";
import { getUserData, updateSelectedWallet } from "@/app/actions/user";
import { displayName } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  user: Awaited<ReturnType<typeof getUserData>>;
};

export default function WalletSelector({ user }: Props) {
  const queryClient = useQueryClient();

  const mutationSelectedWallet = useMutation({
    mutationFn: updateSelectedWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const initialRef = useRef(null);

  // Get label of selected wallet or group
  let label = "";
  if (user?.selectedGroupId) {
    label = user.groups.find(
      (group) => group.id === user.selectedGroupId
    )!.name;
  } else {
    const selectedAddressWallet = user?.addressWallets.find(
      (wallet) => wallet.address === user?.selectedWalletId
    );
    const selectedCustomWallet = user?.customWallets.find(
      (wallet) => wallet.id === user?.selectedWalletId
    );
    if (selectedAddressWallet)
      label = displayName(
        selectedAddressWallet.address,
        selectedAddressWallet.ens
      );
    if (selectedCustomWallet) label = selectedCustomWallet.name;
  }

  return (
    <Menu initialFocusRef={initialRef}>
      <MenuButton as={Button} rightIcon={<FaChevronDown />}>
        {label}
      </MenuButton>
      <MenuList>
        <MenuGroup title="Wallets">
          {user?.addressWallets.map((wallet) => {
            const isSelected =
              !user?.selectedGroupId &&
              wallet.address === user?.selectedWalletId;
            return (
              <MenuItem
                ref={isSelected ? initialRef : undefined}
                icon={isSelected ? <FaCheck /> : undefined}
                key={wallet.address}
                onClick={async () => {
                  mutationSelectedWallet.mutate({
                    selectedWalletId: wallet.address,
                    selectedGroupId: null,
                  });
                }}
              >
                {displayName(wallet.address, wallet.ens)}
              </MenuItem>
            );
          })}
          {user?.customWallets.map((wallet) => {
            const isSelected =
              !user?.selectedGroupId && wallet.id === user?.selectedWalletId;
            return (
              <MenuItem
                ref={isSelected ? initialRef : undefined}
                icon={isSelected ? <FaCheck /> : undefined}
                key={wallet.id}
                onClick={async () => {
                  mutationSelectedWallet.mutate({
                    selectedWalletId: wallet.id,
                    selectedGroupId: null,
                  });
                }}
              >
                {wallet.name}
              </MenuItem>
            );
          })}
        </MenuGroup>
        <MenuGroup title="Groups">
          {user?.groups.map((group) => {
            const isSelected =
              user.selectedGroupId != null && group.id === user.selectedGroupId;
            return (
              <MenuItem
                ref={isSelected ? initialRef : undefined}
                icon={isSelected ? <FaCheck /> : undefined}
                key={group.id}
                onClick={async () => {
                  mutationSelectedWallet.mutate({
                    selectedWalletId: null,
                    selectedGroupId: group.id,
                  });
                }}
              >
                {group.name}
              </MenuItem>
            );
          })}
        </MenuGroup>
      </MenuList>
    </Menu>
  );
}
