import Warning from '@mui/icons-material/Warning';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Link,
    Tab,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useState } from 'react';
import { ListUploadForm } from './uploadForms/List';
import { SRLv5UploadForm } from './uploadForms/Srlv5';

export interface UploadFormProps {
    slug: string;
    close: () => void;
}

interface GoalUploadProps {
    isOpen: boolean;
    close: () => void;
    slug: string;
}

const uploadModes = ['List', 'SRLv5'];

export default function GoalUpload({ isOpen, close, slug }: GoalUploadProps) {
    const [tab, setTab] = useState(uploadModes[0]);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    return (
        <Dialog open={isOpen} onClose={close}>
            <DialogTitle>Upload Goals</DialogTitle>
            <DialogContent>
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList
                            onChange={handleChange}
                            aria-label="upload modes"
                        >
                            {uploadModes.map((tab) => (
                                <Tab key={tab} label={tab} value={tab} />
                            ))}
                        </TabList>
                    </Box>
                    <TabPanel value="List">
                        <Box>
                            <Box
                                sx={{
                                    mb: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    columnGap: 3,
                                    backgroundColor: 'warning.light',
                                    px: 2,
                                    py: 1,
                                }}
                            >
                                <Warning />
                                <Box
                                    sx={{
                                        color: 'warning.contrastText',
                                    }}
                                >
                                    <Typography variant="body2">
                                        Please ensure that the list you upload
                                        is a proper json array.
                                    </Typography>
                                    <Typography variant="body2">
                                        If you have troubles with the data
                                        format, verify that it is correctly
                                        formatted at{' '}
                                        <Link
                                            component={NextLink}
                                            href="https://jsonlint.com"
                                            color="warning.contrastText"
                                        >
                                            jsonlint.com
                                        </Link>
                                    </Typography>
                                    <Typography variant="body2">
                                        Please refresh the page afterwards to
                                        see the changes.
                                    </Typography>
                                </Box>
                            </Box>
                            <ListUploadForm slug={slug} close={close} />
                        </Box>
                    </TabPanel>
                    <TabPanel value="SRLv5">
                        <Box>
                            <Box
                                sx={{
                                    mb: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    columnGap: 3,
                                    backgroundColor: 'warning.light',
                                    px: 2,
                                    py: 1,
                                }}
                            >
                                <Warning />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'warning.contrastText',
                                    }}
                                >
                                    Only use this upload method if you trust the
                                    author of the goal list.
                                </Typography>
                            </Box>
                            <SRLv5UploadForm slug={slug} close={close} />
                        </Box>
                    </TabPanel>
                </TabContext>
            </DialogContent>
        </Dialog>
    );
}
