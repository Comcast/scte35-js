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

import * as util from "./util";

export const enum SpliceDescriptorTag {
    AVAIL_DESCRIPTOR = 0x00,
    DTMF_DESCRIPTOR = 0x01,
    SEGMENTATION_DESCRIPTOR = 0x02,
    TIME_DESCRIPTOR = 0x03,
    // RESERVED 0x04 - 0xFF
}

export interface ISpliceDescriptorBase {
    spliceDescriptorTag: SpliceDescriptorTag;
    descriptorLength: number;
    indentifier: string; // CUEI
}

/**
 * 10.3.1 avail_descriptor()
 */
export interface IAvailDescriptor extends ISpliceDescriptorBase {
    providerAvailId: number;
}

/**
 * 10.3.2 DTMF_descriptor()
 */
export interface IDTMFDescriptor extends ISpliceDescriptorBase {
    preroll: number;
    dtmfCount: number;
    dtmfChar: string[];
}

/**
 * Table 21 segmentation_upid_type
 */
export const enum SegmentationUpidType {
    NOT_USED = 0x00,
    USER_DEFINED = 0x01,
    ISCI = 0x02,
    AD_ID = 0x03,
    UMID = 0x04,
    ISAN = 0x05, // Deprecated
    VISAN = 0x06,
    TID = 0x07,
    TI = 0x08,
    ADI = 0x09,
    EIDR = 0x0a,
    ATSC = 0x0b,
    MPU = 0x0c,
    MID = 0x0d,
    ADS = 0x0e,
    URI = 0x0f,
}

export const enum SegmentationTypeId {
    NOT_INDICATED = 0x00,
    CONTENT_IDENTIFICATION = 0x01,
    PROGRAM_START = 0x10,
    PROGRAM_END = 0x11,
    PROGRAM_EARLY_TERMINATION = 0x12,
    PROGRAM_BREAKAWAY = 0x13,
    PROGRAM_RESUMPTION = 0x14,
    PROGRAM_RUNOVER_PLANNED = 0x15,
    PROGRAM_RUNOVER_UNPLANNED = 0x16,
    PROGRAM_OVERLAP_START = 0x17,
    PROGRAM_BLACKOUT_OVERRIDE = 0x18,
    PROGRAM_START_IN_PROGRESS = 0x19,
    CHAPTER_START = 0x20,
    CHAPTER_END = 0x21,
    PROVIDER_ADVERTISEMENT_START = 0x30,
    PROVIDER_ADVERTISEMENT_END = 0x31,
    DISTRIBUTOR_ADVERTISEMENT_START = 0x32,
    DISTRIBUTOR_ADVERTISEMENT_END = 0x33,
    PROVIDER_PLACEMENT_OPPORTUNITY_START = 0x34,
    PROVIDER_PLACEMENT_OPPORTUNITY_END = 0x35,
    DISTRIBUTOR_PLACEMENT_OPPORTUNITY_START = 0x36,
    DISTRIBUTOR_PLACEMENT_OPPORTUNITY_END = 0x37,
    UNSCHEDULED_EVENT_START = 0x40,
    UNSCHEDULED_EVENT_END = 0x41,
    NETWORK_START = 0x50,
    NETWORK_END = 0x51,
}

export enum SegmentationMessage {
    RESTRICT_GROUP_0 = 0x00,
    RESTRICT_GROUP_1 = 0x01,
    RESTRICT_GROUP_2 = 0x02,
    NONE = 0x03,
}

/**
 * 10.3.3 Segmentation_descriptor()
 */
export interface ISegmentationDescriptor extends ISpliceDescriptorBase {
    segmentationEventId: number;
    segmentationEventCancelIndicator: boolean;
    programSegmentationFlag?: boolean;
    segmentationDurationFlag?: boolean;
    deliveryNotRestrictedFlag?: boolean;
    webDeliveryAllowedFlag?: boolean;
    noRegionalBlackoutFlag?: boolean;
    archiveAllowedFlag?: boolean;
    deviceResctrictions?: SegmentationMessage;
    componentCount?: number;
    // component Tag, pts_offset
    segmentationDuration?: number;
    segmentationUpidType?: SegmentationUpidType;
    segmentationUpidLength?: number;
    segmentationUpid?: Uint8Array;
    // NOTE(estobbart): Even if this type is 0x34 || 0x36,
    // the subSegment* values could still be undefined.
    // The availability of those values depends on the origination
    // of the SCTE35 data and if the 2016 spec is implemented.
    segmentationTypeId?: SegmentationTypeId;
    segmentNum?: number;
    segmentsExpected?: number;
    subSegmentNum?: number;
    subSegmentsExpected?: number;
}

/**
 * 10.3.4 time_descriptor()
 */
export interface ITimeDescriptor extends ISpliceDescriptorBase {
    taiSeconds: number;
    taiNs: number;
    utcOffset: number;
}

export type ISpliceDescriptor = IAvailDescriptor | IDTMFDescriptor | ISegmentationDescriptor | ITimeDescriptor;

/**
 * 10.2 splice_descriptor()
 *
 * NOTE(estobbart): This only supports the base descriptor parsing,
 * Additional payload of the descriptor is handled at the SpliceInfoSection
 * level.
 */
const spliceDescriptor = (view: DataView): ISpliceDescriptor => {
    const descriptor = {} as ISpliceDescriptor;
    let offset = 0;
    descriptor.spliceDescriptorTag = view.getUint8(offset++);
    descriptor.descriptorLength = view.getUint8(offset++);
    descriptor.indentifier = "";
    while (descriptor.indentifier.length < 4) {
        descriptor.indentifier += String.fromCharCode(view.getUint8(offset++));
    }

    return descriptor;
};

/**
 * NOTE(estobbart): The view.byteLength may have additional data beyond
 * the descriptorLength if there are additional descriptors in the
 * array beyond the one being parse at the byteOffset of the view.
 */
export const parseDescriptor = (view: DataView): ISpliceDescriptor => {
    const descriptor = spliceDescriptor(view);
    // splice_descriptor_tag, descriptor_length, & indentifier are the first 6 bytes
    let offset = 6;

    // TODO: parse out the descriptors appropriately using descriptor methods
    if (descriptor.spliceDescriptorTag === SpliceDescriptorTag.AVAIL_DESCRIPTOR) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.AVAIL_DESCRIPTOR");
    } else if (descriptor.spliceDescriptorTag === SpliceDescriptorTag.DTMF_DESCRIPTOR) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.DTMF_DESCRIPTOR");
    } else if (descriptor.spliceDescriptorTag === SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR) {
        const segmentationDescriptor = descriptor as ISegmentationDescriptor;

        segmentationDescriptor.segmentationEventId = view.getUint32(offset);
        offset += 4;

        segmentationDescriptor.segmentationEventCancelIndicator = !!(view.getUint8(offset++) & 0x80);
        // next 7 bits are reserved

        if (!segmentationDescriptor.segmentationEventCancelIndicator) {
            const tmpByte = view.getUint8(offset++);
            segmentationDescriptor.programSegmentationFlag = !!(tmpByte & 0x80);
            segmentationDescriptor.segmentationDurationFlag = !!(tmpByte & 0x40);
            segmentationDescriptor.deliveryNotRestrictedFlag = !!(tmpByte & 0x20);

            if (!segmentationDescriptor.deliveryNotRestrictedFlag) {
                segmentationDescriptor.webDeliveryAllowedFlag = !!(tmpByte & 0x10);
                segmentationDescriptor.noRegionalBlackoutFlag = !!(tmpByte & 0x08);
                segmentationDescriptor.archiveAllowedFlag = !!(tmpByte & 0x04);
                segmentationDescriptor.deviceResctrictions = tmpByte & 0x03;
            }

            if (!segmentationDescriptor.programSegmentationFlag) {
                segmentationDescriptor.componentCount = view.getUint8(offset++);
                console.warn(
                    "scte35-js TODO: segmentationDescriptor.componentCount: " + segmentationDescriptor.componentCount
                );
                // TODO: component count
                offset += segmentationDescriptor.componentCount * 6;
            }

            if (segmentationDescriptor.segmentationDurationFlag) {
                segmentationDescriptor.segmentationDuration = util.shiftThirtyTwoBits(view.getUint8(offset++));
                segmentationDescriptor.segmentationDuration += view.getUint32(offset);
                offset += 4;
            }

            segmentationDescriptor.segmentationUpidType = view.getUint8(offset++);
            segmentationDescriptor.segmentationUpidLength = view.getUint8(offset++);

            let bytesToCopy = segmentationDescriptor.segmentationUpidLength;
            segmentationDescriptor.segmentationUpid = new Uint8Array(bytesToCopy);
            while (bytesToCopy >= 0) {
                bytesToCopy--;
                segmentationDescriptor.segmentationUpid[bytesToCopy] = view.getUint8(offset + bytesToCopy);
            }
            offset += segmentationDescriptor.segmentationUpidLength;

            segmentationDescriptor.segmentationTypeId = view.getUint8(offset++);
            segmentationDescriptor.segmentNum = view.getUint8(offset++);
            segmentationDescriptor.segmentsExpected = view.getUint8(offset++);

            if (
                offset < descriptor.descriptorLength + 2 &&
                (segmentationDescriptor.segmentationTypeId === 0x34 ||
                    segmentationDescriptor.segmentationTypeId === 0x36)
            ) {
                // NOTE(estobbart): The older SCTE-35 spec did not include
                // these additional two bytes
                segmentationDescriptor.subSegmentNum = view.getUint8(offset++);
                segmentationDescriptor.subSegmentsExpected = view.getUint8(offset++);
            }
        }
    } else if (descriptor.spliceDescriptorTag === SpliceDescriptorTag.TIME_DESCRIPTOR) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.TIME_DESCRIPTOR");
    } else {
        console.error(`scte35-js Unrecognized spliceDescriptorTag ${descriptor.spliceDescriptorTag}`);
        offset = descriptor.descriptorLength + 2;
    }

    if (offset !== descriptor.descriptorLength + 2) {
        console.error(`scte35-js Error reading descriptor offset @${offset} of ${descriptor.descriptorLength + 2}`);
    }

    return descriptor;
};
