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
export declare const enum SpliceDescriptorTag {
    AVAIL_DESCRIPTOR = 0,
    DTMF_DESCRIPTOR = 1,
    SEGMENTATION_DESCRIPTOR = 2,
    TIME_DESCRIPTOR = 3
}
export interface ISpliceDescriptorBase {
    spliceDescriptorTag: SpliceDescriptorTag;
    descriptorLength: number;
    indentifier: string;
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
export declare const enum SegmentationUpidType {
    NOT_USED = 0,
    USER_DEFINED = 1,
    ISCI = 2,
    AD_ID = 3,
    UMID = 4,
    ISAN = 5,
    VISAN = 6,
    TID = 7,
    TI = 8,
    ADI = 9,
    EIDR = 10,
    ATSC = 11,
    MPU = 12,
    MID = 13,
    ADS = 14,
    URI = 15
}
export declare const enum SegmentationTypeId {
    NOT_INDICATED = 0,
    CONTENT_IDENTIFICATION = 1,
    PROGRAM_START = 16,
    PROGRAM_END = 17,
    PROGRAM_EARLY_TERMINATION = 18,
    PROGRAM_BREAKAWAY = 19,
    PROGRAM_RESUMPTION = 20,
    PROGRAM_RUNOVER_PLANNED = 21,
    PROGRAM_RUNOVER_UNPLANNED = 22,
    PROGRAM_OVERLAP_START = 23,
    PROGRAM_BLACKOUT_OVERRIDE = 24,
    PROGRAM_START_IN_PROGRESS = 25,
    CHAPTER_START = 32,
    CHAPTER_END = 33,
    PROVIDER_ADVERTISEMENT_START = 48,
    PROVIDER_ADVERTISEMENT_END = 49,
    DISTRIBUTOR_ADVERTISEMENT_START = 50,
    DISTRIBUTOR_ADVERTISEMENT_END = 51,
    PROVIDER_PLACEMENT_OPPORTUNITY_START = 52,
    PROVIDER_PLACEMENT_OPPORTUNITY_END = 53,
    DISTRIBUTOR_PLACEMENT_OPPORTUNITY_START = 54,
    DISTRIBUTOR_PLACEMENT_OPPORTUNITY_END = 55,
    UNSCHEDULED_EVENT_START = 64,
    UNSCHEDULED_EVENT_END = 65,
    NETWORK_START = 80,
    NETWORK_END = 81
}
export declare enum SegmentationMessage {
    RESTRICT_GROUP_0 = 0,
    RESTRICT_GROUP_1 = 1,
    RESTRICT_GROUP_2 = 2,
    NONE = 3
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
    segmentationDuration?: number;
    segmentationUpidType?: SegmentationUpidType;
    segmentationUpidLength?: number;
    segmentationUpid?: Uint8Array;
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
export declare type ISpliceDescriptor = IAvailDescriptor | IDTMFDescriptor | ISegmentationDescriptor | ITimeDescriptor;
/**
 * NOTE(estobbart): The view.byteLength may have additional data beyond
 * the descriptorLength if there are additional descriptors in the
 * array beyond the one being parse at the byteOffset of the view.
 */
export declare const parseDescriptor: (view: DataView) => ISpliceDescriptor;
