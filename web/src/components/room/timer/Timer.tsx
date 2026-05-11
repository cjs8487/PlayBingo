import { RoomContext } from '@/context/RoomContext';
import { Duration } from 'luxon';
import { useContext } from 'react';
import RacetimeCard from '../racetime/RacetimeCard';
import TimerDisplay from './TimerDisplay';

export default function Timer() {
    const { roomData } = useContext(RoomContext);

    if (!roomData) {
        return null;
    }

    const { racetimeConnection } = roomData;

    if (racetimeConnection) {
        return <RacetimeCard />;
    }

    const offset = Duration.fromDurationLike(0);

    return (
        <div className="">
            <TimerDisplay offset={offset} />
        </div>
    );
}
