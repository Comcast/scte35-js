/**
 * Copyright 2018 Comcast Cable Communications Management, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or   implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    SpliceEvent,
    EventTag,
    ISpliceInsertEvent,
    ISpliceSchedule,
    SpliceCommandType,
    ISpliceScheduleEvent,
    ISpliceTime,
    ISpliceInfoSection,
    ISCTE35,
} from "./ISCTE35";
import * as descriptors from "./descriptors";
import * as util from "./util";
import { Buffer } from "buffer/";

export class SCTE35 implements ISCTE35 {
    private buffer = Buffer;

    /***********************************************************************************
     *                               PUBLIC METHODS
     **********************************************************************************/

    /**
     * Parses SCTE35 data from a base64 encoded string
     * @param b64 {string}
     */
    public parseFromB64(b64: string): ISpliceInfoSection {
        const bytes = Uint8Array.from(
            this.parseBase64(b64)
                .split("")
                .map((c) => c.charCodeAt(0))
        );
        return this.parseSCTE35Data(bytes);
    }

    /**
     * Parses SCTE35 data from a hexidecimal encoded string
     * @param hex {string}
     */
    public parseFromHex(hex: string): ISpliceInfoSection {
        const octets = hex.match(/[a-f\d]{2}/gi) || [];
        const bytes = Uint8Array.from(octets.map((octet) => parseInt(octet, 16)));
        return this.parseSCTE35Data(bytes);
    }

    /***********************************************************************************
     *                               PRIVATE METHODS
     **********************************************************************************/

    private parseBase64(b64: string): string {
        return this.buffer.from(b64, "base64").toString("binary");
    }

    private spliceEvent(event: SpliceEvent, view: DataView, tag: EventTag): number {
        let offset = 0;

        event.spliceEventId = view.getUint32(offset);
        offset += 4;

        event.spliceEventCancelIndicator = !!(view.getUint8(offset++) & 0x80);
        if (event.spliceEventCancelIndicator) {
            return offset;
        }

        let byte = view.getUint8(offset++);

        event.outOfNetworkIndicator = !!(byte & 0x80);
        event.programSpliceFlag = !!(byte & 0x40);
        event.durationFlag = !!(byte & 0x20);

        if (tag === SpliceCommandType.SPLICE_INSERT) {
            (event as ISpliceInsertEvent).spliceImmediateFlag = !!(byte & 0x10);
        }

        if (event.programSpliceFlag) {
            if (tag === SpliceCommandType.SPLICE_INSERT && !(event as ISpliceInsertEvent).spliceImmediateFlag) {
                const spliceTime = this.timeSignal(new DataView(view.buffer, view.byteOffset + offset, 5));
                (event as ISpliceInsertEvent).spliceTime = spliceTime;
                offset++;
                if (spliceTime.specified) {
                    offset += 4;
                }
            } else if (tag === SpliceCommandType.SPLICE_SCHEDULE) {
                (event as ISpliceScheduleEvent).utcSpliceTime = view.getUint32(offset);
                offset += 4;
            }
        } else {
            event.componentCount = view.getUint8(offset++);
            if (tag === SpliceCommandType.SPLICE_SCHEDULE) {
                const utcSpliceComponents = [];
                while (utcSpliceComponents.length !== event.componentCount) {
                    utcSpliceComponents.push({
                        componentTag: view.getUint8(offset++),
                        utcSpliceTime: view.getUint32(offset),
                    });
                    offset += 4;
                }
                (event as ISpliceScheduleEvent).utcSpliceComponents = utcSpliceComponents;
            } else {
                console.warn("scte35-js TODO: support splice_insert");
                // TODO:.. support for the array in the SPLICE_INSERT
            }
        }

        if (event.durationFlag) {
            // 6 reserved bits
            byte = view.getUint8(offset++);
            // 9.4.2 break_duration()
            event.breakDuration = {
                autoReturn: !!(byte & 0x80),
                duration: (byte & 0x01 ? util.THIRTY_TWO_BIT_MULTIPLIER : 0) + view.getUint32(offset),
            };
            offset += 4;
        }

        event.uniqueProgramId = view.getUint16(offset);
        offset += 2;

        event.available = view.getUint8(offset++);
        event.expected = view.getUint8(offset++);

        return offset;
    }

    /**
     * 9.3.2 splice_schedule()
     */
    private spliceSchedule(view: DataView): ISpliceSchedule {
        const schedule = {} as ISpliceSchedule;
        schedule.spliceCount = view.getUint8(0);
        schedule.spliceEvents = [];
        let offset = 1;

        while (schedule.spliceEvents.length !== schedule.spliceCount) {
            const event = {} as ISpliceScheduleEvent;
            offset += this.spliceEvent(
                event,
                new DataView(view.buffer, view.byteOffset + offset),
                SpliceCommandType.SPLICE_SCHEDULE
            );
            schedule.spliceEvents.push(event);
        }
        if (offset !== view.byteLength) {
            console.error(`scte35-js Bad read splice_schedule actual: ${offset} expected: ${view.byteLength}`);
        }
        return schedule;
    }

    /**
     * 9.3.3 splice_insert()
     */
    private spliceInsert(view: DataView): ISpliceInsertEvent {
        const insert = {} as ISpliceInsertEvent;
        const offset = this.spliceEvent(insert, view, SpliceCommandType.SPLICE_INSERT);
        if (offset !== view.byteLength) {
            console.error(`scte35-js Bad read splice_insert actual: ${offset} expected: ${view.byteLength}`);
        }
        return insert;
    }

    /**
     * 9.4.1 splice_time()
     */

    /**
     *
     * 9.3.4 time_signal is a single splice_time (9.4.1)
     * so it can also be used in splice_insert
     *
     */
    private timeSignal(view: DataView): ISpliceTime {
        const spliceTime = {} as ISpliceTime;
        const byte = view.getUint8(0);
        spliceTime.specified = !!(byte & 0x80);
        if (spliceTime.specified) {
            spliceTime.pts = byte & 0x01 ? util.THIRTY_TWO_BIT_MULTIPLIER : 0;
            spliceTime.pts += view.getUint32(1);
        }
        return spliceTime;
    }

    // Table 5 splice_info_section
    private parseSCTE35Data(bytes: Uint8Array): ISpliceInfoSection {
        const sis: ISpliceInfoSection = {};

        const view = new DataView(bytes.buffer);
        let offset = 0;

        sis.tableId = view.getUint8(offset++);

        let byte = view.getUint8(offset++);
        sis.selectionSyntaxIndicator = !!(byte & 0x80);
        sis.privateIndicator = !!(byte & 0x40);
        sis.sectionLength = ((byte & 0x0f) << 8) + view.getUint8(offset++);
        if (sis.sectionLength + 3 !== bytes.byteLength) {
            throw new Error(
                `Binary read error sectionLength: ${sis.sectionLength} + 3 !== data.length: ${bytes.byteLength}`
            );
        }

        sis.protocolVersion = view.getUint8(offset++);

        byte = view.getUint8(offset++);
        sis.encryptedPacket = !!(byte & 0x80);
        sis.encryptedAlgorithm = (byte & 0x7e) >> 1;
        if (sis.encryptedPacket) {
            console.error(`scte35-js splice_info_section encrypted_packet ${sis.encryptedAlgorithm} not supported`);
        }
        // NOTE(estobb200): Can't shift JavaScript numbers above 32 bits
        sis.ptsAdjustment = byte & 0x01 ? util.THIRTY_TWO_BIT_MULTIPLIER : 0;
        sis.ptsAdjustment += view.getUint32(offset);
        offset += 4;

        sis.cwIndex = view.getUint8(offset++);
        sis.tier = view.getUint8(offset++) << 4;

        byte = view.getUint8(offset++);
        sis.tier += (byte & 0xf0) >> 4;

        sis.spliceCommandLength = ((byte & 0x0f) << 8) + view.getUint8(offset++);

        sis.spliceCommandType = view.getUint8(offset++);

        if (sis.spliceCommandType !== SpliceCommandType.SPLICE_NULL) {
            const splice = new DataView(bytes.buffer, offset, sis.spliceCommandLength);
            if (sis.spliceCommandType === SpliceCommandType.SPLICE_SCHEDULE) {
                sis.spliceCommand = this.spliceSchedule(splice);
            } else if (sis.spliceCommandType === SpliceCommandType.SPLICE_INSERT) {
                sis.spliceCommand = this.spliceInsert(splice);
            } else if (sis.spliceCommandType === SpliceCommandType.TIME_SIGNAL) {
                sis.spliceCommand = this.timeSignal(splice);
            } else if (sis.spliceCommandType === SpliceCommandType.PRIVATE_COMMAND) {
                console.error(`scte35-js command_type private_command not supported.`);
            }
        }
        offset += sis.spliceCommandLength;

        sis.descriptorLoopLength = view.getUint16(offset);
        offset += 2;

        if (sis.descriptorLoopLength) {
            let bytesToRead = sis.descriptorLoopLength;
            sis.descriptors = [];

            try {
                while (bytesToRead) {
                    const descriptorView = new DataView(bytes.buffer, offset, bytesToRead);
                    const spliceDescriptor = descriptors.parseDescriptor(descriptorView);
                    bytesToRead -= spliceDescriptor.descriptorLength + 2;
                    offset += spliceDescriptor.descriptorLength + 2;
                    sis.descriptors.push(spliceDescriptor);
                }
            } catch (error) {
                console.error(
                    `scte35-js Error reading descriptor @ ${offset}, ignoring remaing bytes: ${bytesToRead} in loop.`
                );
                console.error(error);
                offset += bytesToRead;
                bytesToRead = 0;
            }
        }

        // TODO: alignment_stuffing

        // TODO: validate the crc
        sis.crc = view.getUint32(offset);
        offset += 4;

        if (offset !== view.byteLength) {
            console.error(`scte35-js Bad SCTE35 read - remaining data: ${bytes.slice(offset).join(", ")}`);
        }

        return sis;
    }
}
