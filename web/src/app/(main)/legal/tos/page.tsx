import { Box, Container, Typography } from '@mui/material';

export default function TermsofService() {
    return (
        <Container
            sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
            <Typography variant="h4" component="h1">
                Terms of Service
            </Typography>
            <Box sx={{ display: 'flex', columnGap: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    Effective Date:
                </Typography>
                <Typography>September 17, 2026</Typography>
            </Box>
            <Typography>
                Welcome to PlayBingo. These Terms of Service (&quot;Terms&quot;)
                govern your use of PlayBingo, including the PlayBingo website,
                services, APIs, software, and related features (collectively,
                the &quot;Service&quot;).
            </Typography>
            <Typography>
                By accessing or using PlayBingo, you agree to these Terms. If
                you do not agree to them, do not use the Service.
            </Typography>
            <Typography variant="h5">1. The PlayBingo Service</Typography>
            <Typography>
                PlayBingo is a community-oriented platform for creating,
                managing, and playing bingo games. PlayBingo may provide tools
                for creating games, generating boards, managing game rooms,
                communicating with other players, integrating with third-party
                services, and accessing game data through APIs.
            </Typography>
            <Typography>
                PlayBingo is provided on an ongoing basis, but we do not
                guarantee that the Service will always be available,
                uninterrupted, secure, or error-free. Features may be added,
                changed, suspended, or discontinued at any time.
            </Typography>
            <Typography>
                PlayBingo is provided free of charge. We do not currently
                process payments or financial transactions through the Service.
            </Typography>
            <Typography variant="h5">2. Accounts</Typography>
            <Typography>
                Some features require an account. You are responsible for
                maintaining the security of your account and for activity
                occurring through your account.
            </Typography>
            <Typography>
                You must provide accurate information when creating an account
                and must not impersonate another person or use an account
                without authorization.
            </Typography>
            <Typography>
                You are responsible for keeping your authentication credentials
                secure and should notify us if you believe your account has been
                compromised.
            </Typography>
            <Typography variant="h5">
                3. Community and User-Generated Content
            </Typography>
            <Typography>
                PlayBingo allows users and communities to create, upload,
                submit, and otherwise provide content, including game
                definitions, goals, images, descriptions, text, configurations,
                and other materials (&quot;User Content&quot;).
            </Typography>
            <Typography>
                You retain ownership of the User Content you provide to
                PlayBingo. PlayBingo does not claim ownership of your game data
                or other User Content merely because you submit it to or store
                it through the Service.
            </Typography>
            <Typography>
                By submitting User Content, you grant PlayBingo a non-exclusive,
                worldwide, royalty-free license to host, store, reproduce,
                process, modify as technically necessary, transmit, display, and
                otherwise use that User Content solely as reasonably necessary
                to operate, maintain, secure, develop, and provide the Service.
            </Typography>
            <Typography>
                This license continues for as long as necessary to provide the
                Service with respect to the relevant User Content, including
                reasonable backups and technical copies. You may revoke this
                license by removing the relevant User Content, except where
                continued retention is reasonably necessary for legal, security,
                backup, or other legitimate operational purposes.
            </Typography>
            <Typography>
                You are responsible for the User Content you submit. You
                represent that you have the rights and permissions necessary to
                submit that content and to grant the license described above.
            </Typography>
            <Typography>
                PlayBingo does not endorse or assume responsibility for User
                Content and is not responsible for the accuracy, legality,
                availability, or appropriateness of User Content submitted by
                users or communities.
            </Typography>
            <Typography>
                We may remove, restrict, or disable access to User Content that
                we reasonably believe violates these Terms, applicable law, or
                the rights of others.
            </Typography>
            <Typography variant="h5">
                4. Third-Party Intellectual Property
            </Typography>
            <Typography>
                PlayBingo may display or store material relating to games,
                franchises, software, or other works owned by third parties.
                Such material may include screenshots, characters, names,
                terminology, logos, artwork, images, and other copyrighted or
                otherwise protected material.
            </Typography>
            <Typography>
                Except for rights expressly granted by PlayBingo, all such
                third-party intellectual property remains the property of its
                respective owners. PlayBingo does not claim ownership of
                third-party intellectual property merely because it is displayed
                or used in connection with a game on the Service.
            </Typography>
            <Typography>
                PlayBingo does not grant you any rights to third-party
                intellectual property merely by making it available through the
                Service.
            </Typography>
            <Typography>
                You are responsible for ensuring that content you submit does
                not infringe the intellectual-property rights of others.
            </Typography>
            <Typography variant="h5">5. Copyright Complaints</Typography>
            <Typography>
                If you believe that content available through PlayBingo
                infringes your copyright or other intellectual-property rights,
                please contact us at [CONTACT EMAIL] with sufficient information
                for us to identify the material and understand your claim.
            </Typography>
            <Typography>
                We may remove or restrict access to material that we reasonably
                believe infringes another person&apos;s rights.
            </Typography>
            <Typography>
                Nothing in these Terms limits rights or remedies that cannot
                legally be waived or limited.
            </Typography>
            <Typography variant="h5">6. Acceptable Use</Typography>
            <Typography>
                You may use PlayBingo only for lawful purposes and in accordance
                with these Terms.
            </Typography>
            <Box>
                <Typography>You may not:</Typography>
                <ul>
                    <li>
                        use the Service to violate applicable law or
                        regulations;
                    </li>
                    <li>
                        upload or distribute content that you do not have the
                        right to use;
                    </li>
                    <li>impersonate another person or organization;</li>
                    <li>
                        interfere with or attempt to compromise the security or
                        operation of the Service;
                    </li>
                    <li>
                        intentionally introduce malicious software or other
                        harmful material;
                    </li>
                    <li>
                        abuse APIs, automated systems, or other Service
                        resources in a manner that materially interferes with
                        the Service;
                    </li>
                    <li>
                        attempt to access accounts, data, or systems without
                        authorization;
                    </li>
                    <li>
                        use the Service to harass, threaten, or unlawfully harm
                        others; or
                    </li>
                    <li>
                        circumvent technical restrictions or access controls.
                    </li>
                </ul>
                <Typography>
                    These restrictions do not prohibit activities that are
                    otherwise permitted by the applicable open-source licenses
                    governing PlayBingo software.
                </Typography>
            </Box>
            <Typography variant="h5">7. Open-Source Software</Typography>
            <Typography>
                The PlayBingo software is open-source software made available
                under the GNU General Public License version 3.0 (GPL-3.0).
            </Typography>
            <Typography>
                The Service may also use software components that are
                distributed under other open-source or proprietary licenses.
                Those components remain subject to their respective license
                terms.
            </Typography>
            <Typography>
                The copyright and license information for PlayBingo and relevant
                third-party software and assets is available at
                [CREDITS/LICENSES URL].
            </Typography>
            <Typography>
                These Terms do not replace or restrict rights granted to you
                under applicable open-source licenses.
            </Typography>
            <Typography variant="h5">
                8. Third-Party Services and Infrastructure
            </Typography>
            <Typography>
                PlayBingo may integrate with or rely upon third-party services
                and infrastructure, including hosting providers and external
                services that users may choose to access through PlayBingo.
            </Typography>
            <Typography>
                Your use of third-party services may be subject to their own
                terms and privacy policies.
            </Typography>
            <Typography>
                PlayBingo is not responsible for the availability,
                functionality, policies, or practices of third-party services.
            </Typography>
            <Typography variant="h5">
                9. Changes, Suspension, and Termination
            </Typography>
            <Typography>
                We may modify these Terms from time to time. When we make
                material changes, we will provide reasonable notice through the
                Service or by other appropriate means.
            </Typography>
            <Typography>
                Your continued use of PlayBingo after updated Terms become
                effective constitutes acceptance of the revised Terms.
            </Typography>
            <Typography>
                We may suspend or terminate access to the Service, including an
                account or game, if we reasonably believe that you have violated
                these Terms, created a security or legal risk, or otherwise
                misused the Service.
            </Typography>
            <Typography>You may stop using PlayBingo at any time.</Typography>
            <Typography>
                PlayBingo does not guarantee that the Service, any account, or
                any User Content will be available indefinitely. We may
                discontinue or
            </Typography>
            substantially modify the Service in the future. We do not guarantee
            indefinite preservation of User Content or other data.
            <Typography>
                Sections that by their nature should survive termination,
                including provisions concerning intellectual property,
                disclaimers, limitations of liability, and dispute-related
                provisions, will survive termination.
            </Typography>
            <Typography variant="h5">10. Disclaimer of Warranties</Typography>
            <Typography>
                To the maximum extent permitted by applicable law, PlayBingo and
                the Service are provided on an &quot;as is&quot; and &quot;as
                available&quot; basis.
            </Typography>
            <Typography>
                PlayBingo makes no warranties that the Service will be
                uninterrupted, error-free, secure, accurate, complete, or
                suitable for any particular purpose.
            </Typography>
            <Typography>
                We do not guarantee that User Content or other data available
                through the Service will be preserved or remain available.
            </Typography>
            <Typography>
                Nothing in these Terms excludes or limits any warranty or right
                that cannot legally be excluded or limited.
            </Typography>
            <Typography variant="h5">11. Limitation of Liability</Typography>
            <Typography>
                To the maximum extent permitted by applicable law, PlayBingo and
                its operators, contributors, and service providers will not be
                liable for indirect, incidental, special, consequential,
                exemplary, or punitive damages, or for loss of data, profits,
                revenue, goodwill, or other intangible losses arising from or
                related to your use of the Service.
            </Typography>
            <Typography>
                To the maximum extent permitted by applicable law,
                PlayBingo&apos;s total liability arising from or relating to the
                Service will not exceed the greater of (a) the amount you paid
                to PlayBingo for the Service during the twelve months preceding
                the event giving rise to the claim, or (b) [AMOUNT].
            </Typography>
            <Typography>
                Nothing in these Terms limits liability that cannot legally be
                limited or excluded.
            </Typography>
            <Typography variant="h5">12. Indemnification</Typography>
            <Typography>
                To the maximum extent permitted by applicable law, you agree to
                defend, indemnify, and hold harmless PlayBingo and its operators
                and contributors from claims, liabilities, damages, losses, and
                expenses arising from your User Content, your violation of these
                Terms, your violation of applicable law, or your infringement of
                another person&apos;s rights.
            </Typography>
            <Typography variant="h5">13. Governing Law</Typography>
            <Typography>
                These Terms are governed by the laws of the State of [STATE],
                without regard to its conflict-of-law rules, except to the
                extent that applicable law requires otherwise.
            </Typography>
            <Typography>
                Any dispute arising from these Terms or the Service will be
                resolved in the courts located in [COUNTY/STATE], unless
                applicable law provides otherwise.
            </Typography>
            <Typography variant="h5">14. General</Typography>
            <Typography>
                If any provision of these Terms is found to be unenforceable,
                the remaining provisions will remain in effect.
            </Typography>
            <Typography>
                Our failure to enforce a provision of these Terms does not waive
                our right to enforce it later.
            </Typography>
            <Typography>
                These Terms, together with the Privacy Policy and any other
                terms expressly incorporated by reference, constitute the
                agreement between you and PlayBingo concerning your use of the
                Service.
            </Typography>
            <Typography variant="h5">15. Contact</Typography>
            <Typography>
                Questions regarding these Terms may be sent to:
            </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>
                **[LEGAL/CONTACT EMAIL]**
            </Typography>
            <Typography>PlayBingo</Typography>
            <Typography>[LEGAL ENTITY NAME]</Typography>
            <Typography>[MAILING ADDRESS]</Typography>
        </Container>
    );
}
