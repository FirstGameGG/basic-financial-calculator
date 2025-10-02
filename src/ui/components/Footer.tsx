import { Box, Container, Divider, Link, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/GridLegacy';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BrandSymbol, BrandWordmark } from './BrandLogo';

const FOOTER_LINK_GROUPS = [
  {
    titleKey: 'footer.groupQuickLinks',
    links: [
      { labelKey: 'nav.home', path: '/' },
      { labelKey: 'nav.about', path: '/about' },
    ],
  },
  {
    titleKey: 'footer.groupCalculators',
    links: [
      { labelKey: 'nav.loanCalculator', path: '/calculators/loan' },
      { labelKey: 'nav.timeValue', path: '/calculators/time-value' },
      { labelKey: 'nav.deposits', path: '/calculators/deposits' },
    ],
  },
];

const CONTACT_EMAIL = 'thitichot.k@ku.th';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={(theme) => ({
        mt: 'auto',
        color: theme.palette.mode === 'light' ? alpha('#3A1C10', 0.82) : alpha('#F7F2EB', 0.85),
        backgroundImage:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, rgba(255, 243, 235, 0.95) 0%, rgba(251, 227, 205, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(29, 18, 15, 0.96) 0%, rgba(58, 33, 27, 0.96) 100%)',
        borderTop: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === 'light' ? 0.35 : 0.18)}`,
        backdropFilter: 'blur(14px)',
      })}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 6, md: 8 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <BrandSymbol size={48} label={t('app.title')} />
              <BrandWordmark
                height={28}
                label={undefined}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, minWidth: 112, px: 1 }}
              />
            </Stack>
            <Typography variant="body1" sx={{ maxWidth: 340, lineHeight: 1.6 }}>
              {t('footer.tagline')}
            </Typography>
          </Grid>

          {FOOTER_LINK_GROUPS.map((group) => (
            <Grid item xs={12} sm={6} md={2} key={group.titleKey}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>
                {t(group.titleKey)}
              </Typography>
              <Stack component="nav" spacing={2}>
                {group.links.map((link) => (
                  <Link
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    underline="none"
                    sx={(theme) => ({
                      fontWeight: 500,
                      color: 'inherit',
                      '&:hover': {
                        color:
                          theme.palette.mode === 'light'
                            ? alpha('#6D3B21', 0.95)
                            : alpha('#F9E8D8', 0.9),
                      },
                    })}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>
              {t('footer.groupContact')}
            </Typography>
            <Stack spacing={2}>
              <Typography component="div" variant="body1" sx={{ lineHeight: 1.6 }}>
                {t('footer.contactDescription')}
              </Typography>
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                underline="none"
                sx={(theme) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                  color:
                    theme.palette.mode === 'light'
                      ? alpha('#6D3B21', 0.9)
                      : alpha('#F9E8D8', 0.95),
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                })}
              >
                {CONTACT_EMAIL}
              </Link>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={(theme) => ({ my: { xs: 4, md: 6 }, borderColor: alpha(theme.palette.common.white, 0.2) })} />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Link
            href="https://github.com/FirstGameGG/basic-financial-calculator"
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            underline="none"
            sx={(theme) => ({
              fontWeight: 600,
              color:
                theme.palette.mode === 'light'
                  ? alpha('#6D3B21', 0.95)
                  : alpha('#F9E8D8', 0.95),
              '&:hover': {
                textDecoration: 'underline',
              },
            })}
          >
            {t('footer.license')}
          </Link>
          <Typography variant="body2">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
