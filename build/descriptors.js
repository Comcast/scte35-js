"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("./util");
var SegmentationMessage;
(function (SegmentationMessage) {
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_0"] = 0] = "RESTRICT_GROUP_0";
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_1"] = 1] = "RESTRICT_GROUP_1";
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_2"] = 2] = "RESTRICT_GROUP_2";
    SegmentationMessage[SegmentationMessage["NONE"] = 3] = "NONE";
})(SegmentationMessage = exports.SegmentationMessage || (exports.SegmentationMessage = {}));
/**
 * 10.2 splice_descriptor()
 *
 * NOTE(estobbart): This only supports the base descriptor parsing,
 * Additional payload of the descriptor is handled at the SpliceInfoSection
 * level.
 */
const spliceDescriptor = (view) => {
    const descriptor = {};
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
exports.parseDescriptor = (view) => {
    const descriptor = spliceDescriptor(view);
    // splice_descriptor_tag, descriptor_length, & indentifier are the first 6 bytes
    let offset = 6;
    // TODO: parse out the descriptors appropriately using descriptor methods
    if (descriptor.spliceDescriptorTag === 0 /* AVAIL_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.AVAIL_DESCRIPTOR");
    }
    else if (descriptor.spliceDescriptorTag === 1 /* DTMF_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.DTMF_DESCRIPTOR");
    }
    else if (descriptor.spliceDescriptorTag === 2 /* SEGMENTATION_DESCRIPTOR */) {
        const segmentationDescriptor = descriptor;
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
                console.warn("scte35-js TODO: segmentationDescriptor.componentCount: " + segmentationDescriptor.componentCount);
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
            if (offset < descriptor.descriptorLength + 2 && (segmentationDescriptor.segmentationTypeId === 0x34 || segmentationDescriptor.segmentationTypeId === 0x36)) {
                // NOTE(estobbart): The older SCTE-35 spec did not include
                // these additional two bytes
                segmentationDescriptor.subSegmentNum = view.getUint8(offset++);
                segmentationDescriptor.subSegmentsExpected = view.getUint8(offset++);
            }
        }
    }
    else if (descriptor.spliceDescriptorTag === 3 /* TIME_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.TIME_DESCRIPTOR");
    }
    else {
        console.error(`scte35-js Unrecognized spliceDescriptorTag ${descriptor.spliceDescriptorTag}`);
        offset = descriptor.descriptorLength + 2;
    }
    if (offset !== descriptor.descriptorLength + 2) {
        console.error(`scte35-js Error reading descriptor offset @${offset} of ${descriptor.descriptorLength + 2}`);
    }
    return descriptor;
};
//# sourceMappingURL=descriptors.js.map