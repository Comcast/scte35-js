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

import * as descriptors from "./descriptors";

export interface IBreakDuration {
    autoReturn: boolean;
    duration: number;
}

export interface ISpliceComponent {
    componentTag: number;
}

export interface IUTCSpliceComponent extends ISpliceComponent {
    utcSpliceTime: number;
}

export interface ISpliceEvent {
    spliceEventId: number;
    spliceEventCancelIndicator: boolean;
    outOfNetworkIndicator?: boolean;
    programSpliceFlag?: boolean;
    durationFlag?: boolean;
    componentCount?: number;
    breakDuration?: IBreakDuration;
    uniqueProgramId?: number;
    available?: number;
    expected?: number;
}

type SpliceEvent = ISpliceScheduleEvent | ISpliceInsertEvent;
type EventTag = SpliceCommandType.SPLICE_SCHEDULE | SpliceCommandType.SPLICE_INSERT;

/**
 * A splice_insert and a splice_schedule were similar enough in the properties
 * that spliceEvent was created with a few conditionals in the middle of the
 * read depending on the tag provided.
 */
const spliceEvent = (event: SpliceEvent, view: DataView, tag: EventTag): number => {
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
            const spliceTime = timeSignal(new DataView(view.buffer, offset, 5));
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
            // TODO:.. support for the array in the SPLICE_INSERT
        }

    }

    if (event.durationFlag) {
        // 6 reserved bits
        byte = view.getUint8(offset++);
        // 9.4.2 break_duration()
        event.breakDuration = {
            autoReturn: !!(byte & 0x80),
            duration: ((byte & 0x01) ? THIRTY_TWO_BIT_SHIFT : 0) + view.getUint32(offset),
        };
        offset += 4;
    }

    event.uniqueProgramId = view.getUint16(offset);
    offset += 2;

    event.available = view.getUint8(offset++);
    event.expected = view.getUint8(offset++);

    return offset;
};

export interface ISpliceScheduleEvent extends ISpliceEvent {
    utcSpliceTime?: number;
    utcSpliceComponents?: IUTCSpliceComponent[];
}

export interface ISpliceSchedule {
    spliceCount: number;
    spliceEvents: ISpliceScheduleEvent[];
}

/**
 * 9.3.2 splice_schedule()
 */
const spliceSchedule = (view: DataView): ISpliceSchedule => {
    const schedule = {} as ISpliceSchedule;
    schedule.spliceCount = view.getUint8(0);
    schedule.spliceEvents = [];
    let offset = 1;

    while (schedule.spliceEvents.length !== schedule.spliceCount) {
        const event = {} as ISpliceScheduleEvent;
        offset += spliceEvent(event, new DataView(view.buffer, offset), SpliceCommandType.SPLICE_SCHEDULE);
        schedule.spliceEvents.push(event);
    }
    if (offset !== view.byteLength) {
        console.error(`Bad read splice_schedule actual: ${offset} expected: ${view.byteLength}`);
    }
    return schedule;
};

export interface ISpliceTimeComponent extends ISpliceComponent {
    spliceTime: number;
}

export interface ISpliceInsertEvent extends ISpliceEvent {
    spliceImmediateFlag?: boolean;
    spliceTime?: ISpliceTime;
    spliceTimeComponents?: ISpliceTimeComponent[];
}

/**
 * 9.3.3 splice_insert()
 */
const spliceInsert = (view: DataView): ISpliceInsertEvent => {
    const insert = {} as ISpliceInsertEvent;
    const offset = spliceEvent(insert, view, SpliceCommandType.SPLICE_INSERT);
    if (offset !== view.byteLength) {
        console.error(`Bad read splice_insert actual: ${offset} expected: ${view.byteLength}`);
    }
    return insert;
};

/**
 * 9.4.1 splice_time()
 */
export interface ISpliceTime {
    specified: boolean;
    pts?: number;
}

/**
 *
 * 9.3.4 time_signal is a single splice_time (9.4.1)
 * so it can also be used in splice_insert
 *
 */
const timeSignal = (view: DataView): ISpliceTime => {
    const spliceTime = {} as ISpliceTime;
    const byte = view.getUint8(0);
    spliceTime.specified = !!(byte & 0x80);
    if (spliceTime.specified) {
        spliceTime.pts = (byte & 0x01) ? THIRTY_TWO_BIT_SHIFT : 0;
        spliceTime.pts += view.getUint32(1);
    }
    return spliceTime;
};

const THIRTY_TWO_BIT_SHIFT = Math.pow(2, 32);

export interface ISCTE35 {
    parseFromB64: (b64: string) => ISpliceInfoSection;
    parseFromHex: (hex: string) => ISpliceInfoSection;
}

export const SCTE35: ISCTE35 = Object.create(null) as ISCTE35;

export const enum SpliceCommandType {
    SPLICE_NULL = 0x00,
    // RESERVED 0x01 - 0x03
    SPLICE_SCHEDULE = 0x04,
    SPLICE_INSERT = 0x05,
    TIME_SIGNAL = 0x06,
    BANDWIDTH_RESERVATION = 0x07,
    // RESERVED 0x08 - FE
    PRIVATE_COMMAND = 0xFF // TODO: support parsing into an array buffer or something?
}

export type SpliceCommand = ISpliceSchedule | ISpliceInsertEvent | ISpliceTime;

export interface ISpliceInfoSection {
    tableId: number;
    selectionSyntaxIndicator: boolean;
    privateIndicator: boolean;
    sectionLength: number;
    protocolVersion: number;
    encryptedPacket: boolean;
    encryptedAlgorithm: number;
    ptsAdjustment: number;
    cwIndex: number;
    tier: number;
    spliceCommandLength: number;
    spliceCommandType: SpliceCommandType;
    spliceCommand: SpliceCommand;
    descriptorLoopLength: number;
    descriptor?: descriptors.ISpliceDescriptor[];
    // alignmentStuffing: number; TODO:
    crc: number;
}

const parseSCTE35Data = (bytes: Uint8Array): ISpliceInfoSection => {
    const sis = {} as ISpliceInfoSection;

    const view = new DataView(bytes.buffer);
    let offset = 0;

    sis.tableId = view.getUint8(offset++);

    let byte = view.getUint8(offset++);
    sis.selectionSyntaxIndicator = !!(byte & 0x80);
    sis.privateIndicator = !!(byte & 0x40);
    // const reserved = (byte & 0x03) >> 4;
    sis.sectionLength = ((byte & 0x0F) << 8) + view.getUint8(offset++);


    sis.protocolVersion = view.getUint8(offset++);

    byte = view.getUint8(offset++);
    sis.encryptedPacket = !!(byte & 0x80);
    sis.encryptedAlgorithm = (byte & 0x7E) >> 1;
    if (sis.encryptedPacket) {
        console.error(`splice_info_section encrypted_packet ${sis.encryptedAlgorithm} not supported`);
    }
    // NOTE(estobb200): Can't shift JavaScript numbers above 32 bits
    sis.ptsAdjustment = (byte & 0x01) ? THIRTY_TWO_BIT_SHIFT : 0;
    sis.ptsAdjustment += view.getUint32(offset)
    offset += 4;

    sis.cwIndex = view.getUint8(offset++);
    sis.tier = view.getUint8(offset++) << 4;

    byte = view.getUint8(offset++);
    sis.tier += (byte & 0xF0) >> 4;

    sis.spliceCommandLength = ((byte & 0x0F) << 8) + view.getUint8(offset++);

    sis.spliceCommandType = view.getUint8(offset++);

    if (sis.spliceCommandType != SpliceCommandType.SPLICE_NULL) {
        const splice = new DataView(bytes.buffer, offset, sis.spliceCommandLength);
        if (sis.spliceCommandType === SpliceCommandType.SPLICE_SCHEDULE) {
            sis.spliceCommand = spliceSchedule(splice);
        } else if (sis.spliceCommandType === SpliceCommandType.SPLICE_INSERT) {
            sis.spliceCommand = spliceInsert(splice);
        } else if (sis.spliceCommandType === SpliceCommandType.TIME_SIGNAL) {
            sis.spliceCommand = timeSignal(splice);
        } else if (sis.spliceCommandType === SpliceCommandType.PRIVATE_COMMAND) {
            console.error(`command_type private_command not supported.`);
        }
    }
    offset += sis.spliceCommandLength;

    sis.descriptorLoopLength = view.getUint16(offset);
    offset += 2

    if (sis.descriptorLoopLength) {
        const descriptorView = new DataView(bytes.buffer, offset, sis.descriptorLoopLength);
        sis.descriptor = descriptors.parseDescriptors(descriptorView);

        offset += sis.descriptorLoopLength;
    }

    // TODO: alignment_stuffing

    // TODO: validate the crc
    sis.crc = view.getUint32(offset);
    offset += 4;

    if (offset !== view.byteLength) {
        console.error(`Bad SCTE35 read - remaining data: ${bytes.slice(offset).join(", ")}`);
    }

    return sis;
}

SCTE35.parseFromB64 = (b64: string): ISpliceInfoSection => {
    const bytes = Uint8Array.from(atob(b64).split("").map((c) => c.charCodeAt(0)));
    return parseSCTE35Data(bytes);
}

SCTE35.parseFromHex = (hex: string): ISpliceInfoSection => {
    const octets = hex.match(/[a-f\d]{2}/gi) || [];
    const bytes = Uint8Array.from(octets.map((octet) => parseInt(octet, 16)));
    return parseSCTE35Data(bytes);
}
