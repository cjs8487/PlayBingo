import { Box, Container, Typography } from '@mui/material';

type PolicyBlock =
    | { heading: string; paragraphs: string[]; bullets?: string[] }
    | { heading?: undefined; paragraphs: string[]; bullets?: string[] };

const sections: PolicyBlock[] = [
    {
        heading: '1. Information We Collect',
        paragraphs: [
            'The information we collect depends on how you use PlayBingo.',
        ],
        bullets: [],
    },
    {
        heading: 'Account Information',
        paragraphs: [
            'If you create an account, we may collect information necessary to provide and secure your account, such as:',
        ],
        bullets: [
            'username or display name;',
            'email address, where applicable;',
            'authentication information;',
            'account preferences; and',
            'information associated with your use of PlayBingo.',
        ],
    },
    {
        paragraphs: [
            'We collect information reasonably necessary to provide the functionality associated with your account.',
        ],
    },
    {
        heading: 'Game and Community Data',
        paragraphs: [
            'PlayBingo stores information that users and communities provide when creating, managing, and playing games. This may include:',
        ],
        bullets: [
            'game definitions and configurations;',
            'goals and descriptions;',
            'images and other uploaded assets;',
            'game settings;',
            'game-room information;',
            'player actions and game state; and',
            'other content submitted through the Service.',
        ],
    },
    {
        paragraphs: [
            'Game and community data remains the intellectual property of the person or community that owns it. PlayBingo does not claim ownership of this content.',
            "Information intentionally made public through PlayBingo may be visible to other users and, depending on the feature, may be accessible through PlayBingo's APIs.",
        ],
    },
    {
        heading: 'Technical and Operational Logs',
        paragraphs: [
            'When you use PlayBingo, our systems record technical information necessary to operate, secure, troubleshoot, and understand use of the Service. For most requests, our standard informational logs may include:',
        ],
        bullets: [
            'a session identifier;',
            'IP address;',
            'user agent;',
            'request method and path; and',
            'the resulting response or status.',
        ],
    },
    {
        paragraphs: [
            'A narrow subset of requests may be excluded from some or all standard logging where appropriate. Additional information may be recorded in targeted logs when reasonably necessary to investigate an error, reproduce a problem, address security or usage concerns, or otherwise maintain the Service. Such logging is intended to contain only information reasonably necessary for the relevant purpose.',
            'Operational logs are generally retained for approximately one week. Error and diagnostic logs may be retained for longer periods, including indefinitely where reasonably necessary for debugging, security, development, or maintaining the Service. We may delete such logs at our discretion when they are no longer useful.',
            "Logs are stored within PlayBingo's infrastructure and are not currently backed up to an external system.",
        ],
    },
    {
        heading: 'Analytics and Metrics',
        paragraphs: [
            'PlayBingo collects metrics and analytics to understand how the Service is used, monitor its operation, identify problems, measure performance, and guide development.',
            'Our current analytics infrastructure is operated by PlayBingo itself using self-hosted monitoring and visualization software. We do not currently use a third-party analytics service to collect or sell information about individual users. Analytics are used primarily in aggregated or de-identified form.',
            'We do not use analytics data to sell or target advertising to individual users.',
        ],
    },
    {
        heading: '2. How We Use Information',
        paragraphs: ['We may use information we collect to:'],
        bullets: [
            'provide and operate PlayBingo;',
            'authenticate users and maintain account security;',
            'host and display community-created games and content;',
            'provide APIs and integrations;',
            'monitor the health and performance of the Service;',
            'maintain, troubleshoot, and debug the Service;',
            'detect abuse, fraud, security problems, and other misuse;',
            'enforce rate limits and other usage restrictions;',
            'understand Service usage and improve PlayBingo;',
            'respond to support requests;',
            'develop new features and functionality;',
            'comply with legal obligations; and',
            'protect the rights, safety, and security of PlayBingo, its users, and others.',
        ],
    },
    {
        paragraphs: [
            'We do not sell personal information. We do not use personal information for behavioral advertising or targeted advertising.',
        ],
    },
    {
        heading: '3. How We Share Information',
        paragraphs: [
            'PlayBingo does not sell personal information and does not share personal information with third parties for their own advertising or marketing purposes.',
            'PlayBingo currently operates much of its infrastructure directly, including its analytics, email, and asset-storage systems. We may nevertheless use third-party infrastructure providers to host servers or other infrastructure on which PlayBingo operates.',
            'We may disclose or provide access to information in the following circumstances:',
        ],
    },
    {
        heading: 'Infrastructure Providers',
        paragraphs: [
            'PlayBingo may use third-party hosting and infrastructure providers. These providers may have technical access to the infrastructure on which the Service operates as part of providing their hosting services. We do not authorize infrastructure providers to use PlayBingo user information for their own advertising, marketing, or unrelated purposes.',
            'PlayBingo may adopt additional third-party service providers in the future as the Service develops. If this occurs, this Privacy Policy may be updated to reflect material changes in how information is handled.',
        ],
    },
    {
        heading: 'Legal Requirements',
        paragraphs: [
            'We may disclose information when we reasonably believe disclosure is necessary to comply with applicable law, legal process, court orders, or other lawful requests.',
        ],
    },
    {
        heading: 'Security and Protection',
        paragraphs: [
            'We may disclose information when reasonably necessary to investigate or prevent fraud, security incidents, abuse, or other activity that threatens PlayBingo, its users, or others.',
        ],
    },
    {
        heading: 'With Your Direction',
        paragraphs: [
            'We may disclose information when you explicitly request or authorize us to do so. We do not otherwise provide personal information to third parties for their independent use or commercial purposes.',
        ],
    },
    {
        heading: '4. Access by PlayBingo Staff',
        paragraphs: [
            'Information and logs may be accessible to authorized PlayBingo staff when necessary to operate, maintain, secure, debug, or support the Service.',
            'Direct access to production servers and their logs is currently restricted to PlayBingo staff members who are also authorized developers. Other authorized staff may be able to view relevant operational logs through an authenticated internal interface. Access to this interface is restricted to accounts recognized as authorized PlayBingo staff.',
        ],
    },
    {
        heading: '5. Public Information and Community Content',
        paragraphs: [
            'PlayBingo is a community platform, and some information is intentionally made public by users. For example, a community may choose to publish a game, its goals, game settings, or other content so that other people can access and play the game.',
            'Information that you or another user intentionally makes public through the Service may be viewed, copied, or otherwise used by other people. We cannot control how other users use information that has been made publicly available.',
            'Please do not submit personal or confidential information to public areas of the Service.',
        ],
    },
    {
        heading: '6. Cookies and Session Technologies',
        paragraphs: [
            'PlayBingo may use cookies, local storage, session identifiers, or similar technologies necessary to authenticate users, maintain sessions, remember preferences, provide functionality, and maintain the security of the Service.',
            'Session identifiers may also appear in operational logs as described above. We do not currently use cookies or similar technologies for third-party behavioral advertising.',
        ],
    },
    {
        heading: '7. External Support Services',
        paragraphs: [
            'PlayBingo does not currently process payments or financial transactions through the Service. Users may optionally support PlayBingo through external services, such as Patreon.',
            'When you use an external service to provide financial support, the transaction is handled by that service and is subject to its own terms and privacy policy. PlayBingo does not receive or process payment credentials submitted directly to those services.',
        ],
    },
    {
        heading: '8. Data Retention',
        paragraphs: [
            'We retain information for as long as reasonably necessary to provide the Service, maintain security, comply with legal obligations, resolve disputes, enforce our agreements, and perform legitimate operational functions. Different categories of information may have different retention periods.',
            'Standard operational request logs are generally retained for approximately one week. Error and diagnostic logs may be retained for substantially longer periods, including indefinitely where reasonably necessary for debugging, security, development, or maintaining the Service.',
            'Application data, account information, and community content may be retained while necessary to provide the Service or until deleted by the relevant user or community, subject to legal, security, backup, and other legitimate operational requirements.',
            'We may delete, anonymize, or otherwise securely dispose of information when it is no longer reasonably necessary for these purposes.',
        ],
    },
    {
        heading: '9. Account and Content Deletion',
        paragraphs: [
            'You may request deletion of your account or personal information by contacting us at [PRIVACY/CONTACT EMAIL], subject to applicable legal and operational requirements.',
            'Deleting an account does not necessarily result in immediate deletion of all information. We may retain information when necessary for security, fraud prevention, legal obligations, dispute resolution, backups, or other legitimate purposes.',
            'Community game data may also be retained independently of an individual user account where the data belongs to a community or has been contributed by multiple users.',
        ],
    },
    {
        heading: '10. Security',
        paragraphs: [
            'We take reasonable technical and organizational measures to protect information against unauthorized access, alteration, disclosure, and destruction.',
            'PlayBingo uses multiple layers of access controls to restrict access to production infrastructure, operational logs, and other sensitive systems.',
            'No internet service can guarantee absolute security. We therefore cannot guarantee that information transmitted to or stored by PlayBingo will never be accessed, altered, disclosed, or destroyed through a security incident.',
        ],
    },
    {
        heading: "11. Children's Privacy",
        paragraphs: [
            'PlayBingo is not directed toward children under 13, and we do not knowingly collect personal information from children under 13.',
            'If we learn that we have collected personal information from a child under 13 without the required authorization, we will take reasonable steps to delete that information.',
            'If you believe a child has provided personal information to PlayBingo, please contact us at [PRIVACY/CONTACT EMAIL].',
        ],
    },
    {
        heading: '12. Your Privacy Rights',
        paragraphs: [
            'Depending on where you live, you may have legal rights concerning your personal information, including rights to request access to, correction of, or deletion of certain information.',
            'You may contact us at [PRIVACY/CONTACT EMAIL] to exercise applicable privacy rights or ask questions about our handling of personal information. We will process requests in accordance with applicable law.',
            'We may need to verify your identity before fulfilling certain requests. Nothing in this Privacy Policy limits privacy rights that cannot legally be waived.',
        ],
    },
    {
        heading: '13. California Residents',
        paragraphs: [
            'If applicable California privacy laws apply to you, you may have additional rights concerning your personal information, including rights to know, access, correct, delete, and limit or opt out of certain uses or disclosures of personal information.',
            'PlayBingo does not sell personal information and does not share personal information for cross-context behavioral advertising.',
            'California residents may submit privacy requests using:',
            '[PRIVACY/CONTACT EMAIL]',
            'We will handle qualifying requests in accordance with applicable California law.',
        ],
    },
    {
        heading: '14. International Users',
        paragraphs: [
            'PlayBingo may be operated from and use infrastructure located in the United States or other countries. If you access PlayBingo from outside the United States, your information may therefore be processed in a country whose data-protection laws differ from those in your country of residence.',
            'Where applicable law provides additional rights or protections, we will comply with those requirements.',
        ],
    },
    {
        heading: '15. Changes to This Privacy Policy',
        paragraphs: [
            "We may update this Privacy Policy as PlayBingo's practices, features, infrastructure, or legal obligations change.",
            'When we make material changes, we will provide reasonable notice through the Service or by other appropriate means. The updated policy will indicate its effective date.',
        ],
    },
    {
        heading: '16. Contact',
        paragraphs: [
            'Questions, privacy requests, or concerns regarding this Privacy Policy may be sent to:',
            '[PRIVACY/CONTACT EMAIL]',
            'PlayBingo',
            '[LEGAL ENTITY NAME, IF APPLICABLE]',
            '[MAILING ADDRESS, IF APPLICABLE]',
        ],
    },
];

export default function Privacy() {
    return (
        <Container
            sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
            <Typography variant="h4" component="h1">
                PlayBingo Privacy Policy
            </Typography>
            <Box sx={{ display: 'flex', columnGap: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    Effective Date:
                </Typography>
                <Typography>[DATE]</Typography>
            </Box>
            <Typography>
                This Privacy Policy explains how PlayBingo
                (&quot;PlayBingo,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;) collects, uses, stores, and protects
                information when you use the PlayBingo website, services, APIs,
                and related features (collectively, the &quot;Service&quot;).
            </Typography>
            <Typography>
                PlayBingo is built around community ownership. We do not sell
                personal information, and we do not use personal information for
                targeted advertising.
            </Typography>
            {sections.map((section, index) => (
                <Box
                    key={section.heading ?? index}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                    {section.heading && (
                        <Typography
                            variant={
                                /^\d+\./.test(section.heading) ? 'h5' : 'h6'
                            }
                        >
                            {section.heading}
                        </Typography>
                    )}
                    {section.paragraphs.map((paragraph) => (
                        <Typography
                            key={paragraph}
                            sx={
                                paragraph.startsWith('[PRIVACY/') ||
                                paragraph.startsWith('[LEGAL/')
                                    ? { fontWeight: 'bold' }
                                    : undefined
                            }
                        >
                            {paragraph}
                        </Typography>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                        <Box component="ul" sx={{ mt: 0, mb: 0 }}>
                            {section.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                            ))}
                        </Box>
                    )}
                </Box>
            ))}
        </Container>
    );
}
