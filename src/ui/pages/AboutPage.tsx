import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import { Avatar, Box, Card, CardContent, Link, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const highlightKeys = ['privacy', 'coverage', 'support'] as const;
const highlightIcons = {
  privacy: LockOutlinedIcon,
  coverage: CalculateOutlinedIcon,
  support: PublicOutlinedIcon,
} as const;

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  email?: string;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

export const AboutPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const missionParagraphs = t('about.mission.paragraphs', {
    returnObjects: true,
  }) as string[];

  const teamMembers = (t('about.team.members', {
    returnObjects: true,
  }) as TeamMember[]) ?? [];

  return (
    <Stack spacing={5}>
      {/* Hero Section */}
      <Box sx={{ mb: 2 }}>
        <Stack spacing={2}>
          <Typography 
            variant="overline" 
            color="primary.main"
            sx={{ 
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: '0.875rem'
            }}
          >
            {t('about.hero.kicker')}
          </Typography>
          <Typography 
            variant="h2" 
            component="h1"
            sx={{ mb: 1 }}
          >
            {t('about.title')}
          </Typography>
          <Typography 
            variant="h5" 
            component="p"
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              mb: 1
            }}
          >
            {t('about.hero.title')}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: 720,
              lineHeight: 1.7
            }}
          >
            {t('about.hero.description')}
          </Typography>
        </Stack>
      </Box>

      {/* Mission Card */}
      <Card 
        variant="outlined"
        sx={{
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography 
              variant="h5"
              sx={{ fontWeight: 600 }}
            >
              {t('about.mission.title')}
            </Typography>
            <Stack spacing={2}>
              {missionParagraphs.map((paragraph, index) => (
                <Typography 
                  key={index} 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.75 }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Highlights Grid - Rule of 8: 24px gaps */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {highlightKeys.map((key) => {
          const IconComponent = highlightIcons[key];
          return (
            <Card 
              key={key}
              variant="outlined" 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2.5} sx={{ height: '100%' }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: theme.palette.mode === 'light' 
                        ? 'primary.light' 
                        : 'primary.dark',
                      color: theme.palette.mode === 'light'
                        ? 'primary.dark'
                        : 'primary.light',
                      width: 56,
                      height: 56,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <IconComponent fontSize="medium" />
                  </Avatar>
                  <Stack spacing={1.5}>
                    <Typography 
                      variant="h6"
                      sx={{ fontWeight: 600 }}
                    >
                      {t(`about.highlights.${key}.title`)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {t(`about.highlights.${key}.description`)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Two Column Layout for Contact and Team */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* Contact Card */}
        <Card 
          variant="outlined"
          sx={{
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Stack spacing={1.5}>
                <Typography 
                  variant="h6"
                  sx={{ fontWeight: 600 }}
                >
                  {t('about.contact.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {t('about.contact.description')}
                </Typography>
              </Stack>
              <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                sx={{ 
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'light' 
                    ? 'primary.light' 
                    : 'background.paper',
                  border: theme.palette.mode === 'light' 
                    ? 'none' 
                    : `1px solid ${theme.palette.primary.dark}`,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    width: 48,
                    height: 48,
                  }}
                >
                  <EmailOutlinedIcon />
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    {t('about.contact.emailLabel')}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ fontWeight: 500 }}
                  >
                    {t('about.contact.emailValue')}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card 
          variant="outlined"
          sx={{
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Typography 
                variant="h6"
                sx={{ fontWeight: 600 }}
              >
                {t('about.team.title')}
              </Typography>
              <Stack spacing={3}>
                {teamMembers.map((member) => (
                  <Stack
                    key={member.name}
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        width: 56,
                        height: 56,
                        fontWeight: 700,
                        fontSize: '1.25rem',
                      }}
                    >
                      {getInitials(member.name)}
                    </Avatar>
                    <Stack spacing={0.75} sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={700}
                      >
                        {member.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="primary.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {member.role}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {member.bio}
                      </Typography>
                      {member.email ? (
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                          }}
                        >
                          {member.email}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Repository Card - Full Width */}
      <Card 
        variant="outlined"
        sx={{
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(236,165,118,0.08) 0%, rgba(255,255,255,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,190,138,0.05) 0%, rgba(36,27,22,0.95) 100%)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: theme.palette.mode === 'light'
                  ? 'primary.main'
                  : 'primary.dark',
                color: theme.palette.mode === 'light'
                  ? 'primary.contrastText'
                  : 'primary.light',
                width: 64,
                height: 64,
                transition: 'all 0.3s ease',
              }}
            >
              <GitHubIcon fontSize="large" />
            </Avatar>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              <Typography 
                variant="h5"
                sx={{ fontWeight: 600 }}
              >
                {t('about.license.title')}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                {t('about.license.description')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Link
                  href="https://github.com/FirstGameGG/basic-financial-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: 'primary.main',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'primary.dark',
                    }
                  }}
                >
                  {t('about.license.linkLabel')} →
                </Link>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default AboutPage;
