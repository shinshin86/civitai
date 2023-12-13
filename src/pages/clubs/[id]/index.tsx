import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { PageLoader } from '~/components/PageLoader/PageLoader';
import { NotFound } from '~/components/AppLayout/NotFound';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  createStyles,
  Divider,
  Grid,
  Group,
  Loader,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ImageCSSAspectRatioWrap } from '~/components/Profile/ImageCSSAspectRatioWrap';
import { constants } from '~/server/common/constants';
import { ImageGuard } from '~/components/ImageGuard/ImageGuard';
import { MediaHash } from '~/components/ImageHash/ImageHash';
import { ImagePreview } from '~/components/ImagePreview/ImagePreview';
import { AlertWithIcon } from '~/components/AlertWithIcon/AlertWithIcon';
import {
  IconAlertCircle,
  IconClock,
  IconClubs,
  IconInfoCircle,
  IconManualGearbox,
  IconPencilMinus,
  IconSettings,
} from '@tabler/icons-react';
import { ClubManagementNavigation } from '~/components/Club/ClubManagementNavigation';
import { ClubFeedNavigation } from '~/components/Club/ClubFeedNavigation';
import { RenderHtml } from '~/components/RenderHtml/RenderHtml';
import { ContentClamp } from '~/components/ContentClamp/ContentClamp';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { useClubContributorStatus, useQueryClubPosts } from '~/components/Club/club.utils';
import { InViewLoader } from '~/components/InView/InViewLoader';
import { EndOfFeed } from '~/components/EndOfFeed/EndOfFeed';
import { NoContent } from '~/components/NoContent/NoContent';
import {
  ClubPostUpsertForm,
  ClubPostUpsertFormModal,
} from '~/components/Club/ClubPost/ClubPostUpsertForm';
import { ClubPostItem, useClubFeedStyles } from '~/components/Club/ClubPost/ClubFeed';
import { ClubTierItem } from '~/components/Club/ClubTierItem';
import { dialogStore } from '~/components/Dialog/dialogStore';
import { formatDate } from '~/utils/date-helpers';
import { ClubMembershipRole } from '@prisma/client';
import { containerQuery } from '~/utils/mantine-css-helpers';

const Feed = () => {
  const utils = trpc.useContext();
  const router = useRouter();
  const { id: stringId } = router.query as {
    id: string;
  };
  const id = Number(stringId);
  const { clubPosts, isLoading, fetchNextPage, hasNextPage, isRefetching } = useQueryClubPosts(id);
  const { data: userClubs = [], isLoading: isLoadingUserClubs } =
    trpc.club.userContributingClubs.useQuery();
  const { classes } = useClubFeedStyles();

  const canPost = useMemo(() => {
    return userClubs.some((c) => c.id === id);
  }, [userClubs, isLoadingUserClubs]);

  return (
    <>
      {isLoading ? (
        <Center p="xl">
          <Loader size="xl" />
        </Center>
      ) : !!clubPosts.length ? (
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isRefetching ?? false} zIndex={9} />
          <Stack spacing="md" mt="md">
            {clubPosts.map((clubPost) => (
              <ClubPostItem key={clubPost.id} clubPost={clubPost} />
            ))}
          </Stack>
          {hasNextPage && (
            <InViewLoader
              loadFn={fetchNextPage}
              loadCondition={!isRefetching}
              style={{ gridColumn: '1/-1' }}
            >
              <Center p="xl" sx={{ height: 36 }} mt="md">
                <Loader />
              </Center>
            </InViewLoader>
          )}
          {!hasNextPage && (
            <Stack mt="xl">
              <Divider
                size="sm"
                label={
                  <Group spacing={4}>
                    <IconClock size={16} stroke={1.5} />
                    You are all caught up
                  </Group>
                }
                labelPosition="center"
                labelProps={{ size: 'sm' }}
              />
              <Text color="dimmed" align="center" size="sm">
                Looks like you&rsquo;re all caught up for now. Come back later and the owner might
                have added more stuff
              </Text>
            </Stack>
          )}
        </div>
      ) : (
        <Stack mt="xl">
          <Divider
            size="sm"
            label={
              <Group spacing={4}>
                <IconClubs size={16} stroke={1.5} />
                Looks like this club has not posted anything yet
              </Group>
            }
            labelPosition="center"
            labelProps={{ size: 'sm' }}
          />
          <Center>
            <Stack spacing={0} align="center">
              <Text size="sm" color="dimmed">
                Check back later and the owner might have posted something
              </Text>
            </Stack>
          </Center>
        </Stack>
      )}
    </>
  );
};

const useStyles = createStyles<string, { hasHeaderImage: boolean }>(
  (theme, { hasHeaderImage }) => ({
    mainContainer: {
      position: 'relative',
      top: hasHeaderImage ? -constants.clubs.avatarDisplayWidth / 2 : undefined,

      [containerQuery.smallerThan('sm')]: {
        top: hasHeaderImage ? -constants.clubs.avatarDisplayWidth / 4 : undefined,
      },
    },

    avatar: {
      width: constants.clubs.avatarDisplayWidth,

      [containerQuery.smallerThan('sm')]: {
        margin: 'auto',
      },
    },
  })
);
export const FeedLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { id: stringId } = router.query as {
    id: string;
  };
  const id = Number(stringId);
  const { data: club, isLoading: loading } = trpc.club.getById.useQuery({ id });
  const { data: userClubs = [], isLoading: isLoadingUserClubs } =
    trpc.club.userContributingClubs.useQuery();
  const { data: membership, isLoading: loadingMembership } =
    trpc.clubMembership.getClubMembershipOnClub.useQuery({
      clubId: id,
    });
  const currentUser = useCurrentUser();
  const isOwner = currentUser && club?.userId === currentUser?.id;
  const isModerator = currentUser?.isModerator;
  const isAdmin = membership?.role === ClubMembershipRole.Admin;

  const { classes } = useStyles({ hasHeaderImage: !!club?.headerImage });

  const canPost = useMemo(() => {
    return isModerator || isOwner || userClubs.some((c) => c.id === id);
  }, [membership, userClubs, isLoadingUserClubs]);

  const { data: tiers = [], isLoading: isLoadingTiers } = trpc.club.getTiers.useQuery(
    {
      clubId: club?.id as number,
      listedOnly: true,
      joinableOnly: true,
    },
    {
      enabled: !!club?.id,
    }
  );

  if (loading) {
    return <PageLoader />;
  }

  if (!club) {
    return <NotFound />;
  }

  return (
    <AppLayout>
      <Container fluid p={0} mt={club.headerImage ? '-md' : ''}>
        {club.headerImage && (
          <ImageCSSAspectRatioWrap
            aspectRatio={constants.clubs.headerImageAspectRatio}
            style={{ borderRadius: 0 }}
          >
            <ImageGuard
              images={[club.headerImage]}
              connect={{ entityId: club.headerImage.id, entityType: 'club' }}
              render={(image) => {
                return (
                  <ImageGuard.Content>
                    {({ safe }) => (
                      <>
                        {!safe ? (
                          <MediaHash {...image} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <ImagePreview
                            image={image}
                            edgeImageProps={{ width: 1200 }}
                            style={{ width: '100%', height: '100%' }}
                            aspectRatio={0}
                          />
                        )}
                        <div style={{ width: '100%', height: '100%' }}>
                          <ImageGuard.ToggleConnect position="top-left" />
                          <ImageGuard.Report withinPortal />
                        </div>
                      </>
                    )}
                  </ImageGuard.Content>
                );
              }}
            />
          </ImageCSSAspectRatioWrap>
        )}
        <Container size="xl" className={classes.mainContainer}>
          {club.avatar && (
            <ImageCSSAspectRatioWrap aspectRatio={1} className={classes.avatar}>
              <ImageGuard
                images={[club.avatar]}
                connect={{ entityId: club.avatar.id, entityType: 'club' }}
                render={(image) => {
                  return (
                    <ImageGuard.Content>
                      {({ safe }) => (
                        <>
                          {!safe ? (
                            <MediaHash {...image} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <ImagePreview
                              image={image}
                              edgeImageProps={{ width: 450 }}
                              radius="md"
                              style={{ width: '100%', height: '100%' }}
                              aspectRatio={0}
                            />
                          )}
                          <div style={{ width: '100%', height: '100%' }}>
                            <ImageGuard.ToggleConnect position="top-left" />
                            <ImageGuard.Report withinPortal />
                          </div>
                        </>
                      )}
                    </ImageGuard.Content>
                  );
                }}
              />
            </ImageCSSAspectRatioWrap>
          )}
          <Stack spacing="md" mt="md">
            <Grid>
              <Grid.Col xs={12} md={9}>
                <Stack spacing="lg">
                  <Title order={1}>{club.name}</Title>
                  {club.description && (
                    <ContentClamp maxHeight={145}>
                      <RenderHtml html={club.description} />
                    </ContentClamp>
                  )}
                  <Group>
                    {canPost && (
                      <Button
                        onClick={() => {
                          dialogStore.trigger({
                            component: ClubPostUpsertFormModal,
                            props: {
                              clubId: club.id,
                            },
                          });
                        }}
                        leftIcon={<IconPencilMinus />}
                      >
                        Post content
                      </Button>
                    )}
                    {(isOwner || isAdmin || isModerator) && (
                      <Button
                        component={'a'}
                        href={`/clubs/manage/${club.id}`}
                        leftIcon={<IconSettings />}
                        color="gray"
                      >
                        Manage
                      </Button>
                    )}
                  </Group>
                  <ClubFeedNavigation id={club.id} />
                </Stack>
                {children}
              </Grid.Col>
              <Grid.Col xs={12} md={3}>
                <Stack>
                  <Title order={3}>Membership Tiers</Title>
                  {membership?.cancelledAt ? (
                    <Alert color="yellow">
                      <Text size="sm">
                        Your membership was cancelled on {formatDate(membership.cancelledAt)} and
                        will be active until{' '}
                        <Text weight="bold" component="span">
                          {formatDate(membership.expiresAt)}
                        </Text>
                        .
                      </Text>
                    </Alert>
                  ) : membership?.nextBillingAt ? (
                    <Alert color="yellow">
                      <Text size="sm">
                        You are a member of this club. Your next billing date is{' '}
                        <Text weight="bold" component="span">
                          {formatDate(membership.nextBillingAt)}
                        </Text>
                        .
                      </Text>
                    </Alert>
                  ) : null}
                  {tiers.length > 0 ? (
                    <>
                      {tiers.map((tier) => (
                        <ClubTierItem key={tier.id} clubTier={tier} />
                      ))}
                    </>
                  ) : (
                    <Text color="dimmed">
                      The owner of this club has not added any club tiers yet.
                    </Text>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Container>
      </Container>
    </AppLayout>
  );
};

Feed.getLayout = function getLayout(page: React.ReactNode) {
  return <FeedLayout>{page}</FeedLayout>;
};

export default Feed;
