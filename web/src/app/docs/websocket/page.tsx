import { Box, Typography } from '@mui/material';
import { ClassAttributes, HTMLAttributes } from 'react';
import ReactMarkdown, { ExtraProps } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MarkdownHeader({
    children,
    node,
    ...props
}: ClassAttributes<HTMLHeadingElement> &
    HTMLAttributes<HTMLHeadingElement> &
    ExtraProps) {
    return (
        <Typography
            variant={node?.tagName as Extract<'variant', typeof Typography>}
            {...props}
            sx={{
                pb: 1,
                mb: 2,
                mt: 4,
                borderBottom: 1,
                borderBottomColor: 'grey.700',
            }}
        >
            {children}
        </Typography>
    );
}

async function getMarkdown() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/docs/websocket.md`,
    );
    return res.text();
}

export default async function WebsocketDocs() {
    const markdown = await getMarkdown();
    return (
        <Box
            sx={{
                px: 8,
            }}
        >
            <ReactMarkdown
                components={{
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <SyntaxHighlighter
                                //@ts-ignore for some reason ts doesn't like
                                //this line
                                style={a11yDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    h1({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    h2({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    h3({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    h4({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    h5({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    h6({ children, ...props }) {
                        return (
                            <MarkdownHeader {...props}>
                                {children}
                            </MarkdownHeader>
                        );
                    },
                    p({ children, ...props }) {
                        return (
                            <Typography
                                {...props}
                                sx={{
                                    mb: 1,
                                }}
                            >
                                {children}
                            </Typography>
                        );
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </Box>
    );
}
