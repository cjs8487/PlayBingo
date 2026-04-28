'use client';
import Board from '@/components/board/Board';
import PlayerInfo from '@/components/room/PlayerInfo';
import PlayerList from '@/components/room/PlayerList';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import Timer from '@/components/room/timer/Timer';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import {
    ColorArea,
    ColorChannel,
    ColorField,
    ColorPicker,
    ColorSpace,
    ColorSwatch,
    ColorSwatchPicker,
    Label,
    ListBox,
    Select,
    Separator,
    Surface,
    Switch,
} from '@heroui/react';
import { Box, Dialog, DialogContent, Stack } from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useState } from 'react';
import { useLocalStorage } from 'react-use';
import ConnectionState from '../../../../components/room/ConnectionState';

export default function Room() {
    const { connectionStatus, roomData } = useRoomContext();

    let showLogin = false;
    if (connectionStatus === ConnectionStatus.UNINITIALIZED) {
        showLogin = true;
    }

    // something went wrong attempting to connect to the server, show the login
    // page which when submitted will restart the connection process, or show an
    // adequate error message on failure
    if (connectionStatus === ConnectionStatus.CLOSED && !roomData) {
        showLogin = true;
    }

    return (
        <>
            <Box sx={{ width: '100%', height: '100%', maxHeight: '100%' }}>
                <Box
                    sx={{
                        display: { xs: 'flex', sm: 'none' },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomXs />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            sm: 'flex',
                            md: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomSm />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            md: 'flex',
                            lg: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomMd />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            lg: 'flex',
                            xl: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        columnGap: 1,
                        p: 1,
                    }}
                >
                    <RoomLg />
                </Box>
                <Box
                    sx={{
                        display: { xs: 'none', xl: 'flex' },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        columnGap: 1,
                    }}
                >
                    <RoomXl />
                </Box>
            </Box>
            <Dialog open={showLogin}>
                <DialogContent>
                    <RoomLogin />
                </DialogContent>
            </Dialog>
        </>
    );
}

function RoomXs() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <RoomInfo />
            <Timer />
            <PlayerInfo />
            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Board />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomSm() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ flex: '0 0 auto' }}>
                <RoomInfo />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <Timer />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Board />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomMd() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 2,
                    flex: '0 0 auto',
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <RoomInfo />
                </Box>
                <Box sx={{ flex: '0 0 auto' }}>
                    <Timer />
                </Box>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 1,
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        minHeight: '400px',
                        overflow: 'hidden',
                    }}
                >
                    <Board />
                </Box>
                <Box sx={{ flex: '0 0 auto', minWidth: '200px' }}>
                    <PlayerList />
                </Box>
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomLg() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                maxHeight: 'calc(100vh - 64px - 78px - 16px)',
                display: 'grid',
                gridTemplateRows: 'auto auto auto 1fr 1fr',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 450px)',
                gap: 1,
                overflow: 'hidden',
            }}
        >
            <Box sx={{ gridRow: '1 / -1', gridColumn: 1, overflow: 'hidden' }}>
                <Board />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <RoomInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <PlayerInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <Timer />
            </Box>
            <Box
                sx={{
                    gridRow: 4,
                    gridColumn: 2,
                    overflow: 'hidden',
                }}
            >
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: 5, gridColumn: 2, overflow: 'hidden' }}>
                <RoomChat />
            </Box>
        </Box>
    );
}

function RoomXl() {
    const {
        roomData,
        players,
        showCounters,
        toggleCounters,
        showGoalDetails,
        toggleGoalDetails,
        color,
        changeColor,
    } = useRoomContext();

    const [storedCustomColor] = useLocalStorage('PlayBingo.customcolor', '');

    const [colorSpace, setColorSpace] = useState<ColorSpace>('rgb');
    const colorChannelsByColorSpace: Record<ColorSpace, ColorChannel[]> = {
        hsb: ['hue', 'saturation', 'brightness'],
        hsl: ['hue', 'saturation', 'lightness'],
        rgb: ['red', 'green', 'blue'],
    };

    if (!roomData) {
        return null;
    }

    return (
        <div className="grid h-full w-full grid-cols-[300px_1fr_300px] grid-rows-[auto_1fr] overflow-hidden">
            <div className="relative col-span-full flex items-center justify-center bg-linear-to-r from-[#600011] from-40% to-[#b769fa] to-90% p-3">
                <div className="grow">
                    <div className="mb-0.5 text-lg">{roomData.name}</div>
                    <div className="mb-1.5 flex text-xs">
                        <div>
                            {roomData.game} ({roomData.variant})
                        </div>
                    </div>
                    <div className="flex text-xs">
                        <div>{roomData.slug}</div>
                        <Separator
                            orientation="vertical"
                            className="bg-foreground/50 mx-2"
                        />
                        <div>{roomData.mode}</div>
                        <Separator
                            orientation="vertical"
                            className="bg-foreground/50 mx-2"
                        />
                        <div>{roomData.seed}</div>
                    </div>
                </div>
                <div className="absolute text-center font-mono text-3xl">
                    <Timer />
                </div>
                <div>
                    <ConnectionState />
                </div>
            </div>
            <Surface className="p-3">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="mb-2 flex items-center border-l-6 border-(--player-color) p-2 shadow-[0_0_6px_var(--player-color)]"
                        style={
                            {
                                '--player-color': player.color,
                            } as React.CSSProperties
                        }
                    >
                        <div className="grow">{player.nickname}</div>
                        {player.monitor && (
                            <Sword fontSize="small" sx={{ color: 'green' }} />
                        )}
                    </div>
                ))}
                <Separator variant="secondary" className="mt-4 mb-4" />
                <ColorPicker
                    defaultValue={color}
                    onChange={(color) => changeColor(color.toString('hex'))}
                >
                    <ColorPicker.Trigger className="items-center">
                        <ColorSwatch />
                        <Label>Change Color</Label>
                    </ColorPicker.Trigger>
                    <ColorPicker.Popover>
                        <ColorArea
                            colorSpace="hsb"
                            xChannel="saturation"
                            yChannel="brightness"
                        >
                            <ColorArea.Thumb />
                        </ColorArea>
                        <Select
                            aria-label="Color space"
                            value={colorSpace}
                            variant="secondary"
                            onChange={(value) =>
                                setColorSpace(value as ColorSpace)
                            }
                        >
                            <Select.Trigger>
                                <Select.Value className="uppercase" />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    {Object.keys(colorChannelsByColorSpace).map(
                                        (space) => (
                                            <ListBox.Item
                                                key={space}
                                                className="uppercase"
                                                id={space}
                                                textValue={space}
                                            >
                                                {space}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ),
                                    )}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                        <div className="grid w-full grid-cols-3 items-center gap-2">
                            {colorChannelsByColorSpace[colorSpace].map(
                                (channel) => (
                                    <ColorField
                                        key={channel}
                                        aria-label={channel}
                                        channel={channel}
                                        colorSpace={colorSpace}
                                    >
                                        <ColorField.Group variant="secondary">
                                            <ColorField.Input />
                                        </ColorField.Group>
                                    </ColorField>
                                ),
                            )}
                        </div>
                        <ColorSwatchPicker variant="square">
                            {[
                                '#ff0000',
                                '#0000ff',
                                '#FFA500',
                                '#008000',
                                '#800080',
                                storedCustomColor ?? '#000000',
                            ].map((colorItem) => (
                                <ColorSwatchPicker.Item
                                    key={colorItem}
                                    color={colorItem}
                                >
                                    <ColorSwatchPicker.Swatch />
                                    <ColorSwatchPicker.Indicator />
                                </ColorSwatchPicker.Item>
                            ))}
                        </ColorSwatchPicker>
                    </ColorPicker.Popover>
                </ColorPicker>
                <Separator variant="secondary" className="mt-4 mb-4" />
                <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold">Settings</div>
                    <Switch
                        isSelected={showCounters}
                        onChange={(show) => {
                            if (show !== showCounters) {
                                toggleCounters();
                            }
                        }}
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Content>
                            <Label>Show Counters</Label>
                        </Switch.Content>
                    </Switch>
                    <Switch
                        isSelected={showGoalDetails}
                        onChange={(show) => {
                            if (show !== showGoalDetails) {
                                toggleGoalDetails();
                            }
                        }}
                    >
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Content>
                            <Label>Show All Goal Details</Label>
                        </Switch.Content>
                    </Switch>
                </div>
            </Surface>
            <div className="board-wrapper relative h-full rounded-xl p-6">
                <Board />
            </div>
            <div className="relative h-full">
                <RoomChat />
            </div>
        </div>
    );
    // return (
    //     <Box
    //         sx={{
    //             width: '100%',
    //             height: '100%',
    //             maxHeight: 'calc(100vh - 64px - 78px - 16px)',
    //             display: 'grid',
    //             gridTemplateRows: 'auto auto auto auto 1fr',
    //             gridTemplateColumns:
    //                 'minmax(0, 2fr) minmax(350px, 450px) minmax(300px, 400px)',
    //             gap: 2,
    //             overflow: 'hidden',
    //         }}
    //     >
    //         <Box
    //             sx={{
    //                 width: '100%',
    //                 height: '100%',
    //                 gridRow: '1 / -1',
    //                 gridColumn: 1,
    //                 overflow: 'hidden',
    //             }}
    //         >
    //             <Board />
    //         </Box>
    //         <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
    //             <RoomInfo />
    //         </Box>
    //         <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
    //             <RoomInfo />
    //         </Box>
    //         <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
    //             <PlayerInfo />
    //         </Box>
    //         <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
    //             <Timer />
    //         </Box>
    //         <Box sx={{ gridRow: '4 / -1', gridColumn: 2, overflow: 'hidden' }}>
    //             <PlayerList />
    //         </Box>
    //         <Box sx={{ gridRow: '1 / -1', gridColumn: 3, overflow: 'hidden' }}>
    //         <Box sx={{ gridRow: '1 / -1', gridColumn: 3, overflow: 'hidden' }}>
    //             <RoomChat />
    //         </Box>
    //     </Box>
    // );
}
