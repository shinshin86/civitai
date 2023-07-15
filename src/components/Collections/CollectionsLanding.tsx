import {
  NavLink,
  ScrollArea,
  Stack,
  TextInput,
  createStyles,
  Skeleton,
  Text,
  Center,
  Alert,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { CollectionContributorPermission } from '@prisma/client';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useCollectionQueryParams } from '~/components/Collections/collection.utils';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { trpc } from '~/utils/trpc';

export function CollectionsLanding() {
  return (
    <Center>
      <Alert>Collections landing coming soon</Alert>
    </Center>
  );
}
