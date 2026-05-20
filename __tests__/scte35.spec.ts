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

import { expect } from "chai";
import { SCTE35 } from "../src/scte35";
import {
    ISpliceInsertEvent,
    ISpliceTime,
    ISplicePrivate,
    ISpliceSchedule,
    SpliceCommandType,
} from "../src/ISCTE35";
import * as descriptors from "../src/descriptors";
import * as util from "../src/util";

const CUEI = [0x43, 0x55, 0x45, 0x49];

const toView = (bytes: number[]): DataView => new DataView(Uint8Array.from(bytes).buffer);

const makeDescriptor = (tag: number, body: number[]): number[] => [tag, CUEI.length + body.length, ...CUEI, ...body];

const makeSection = (
    spliceCommandType: SpliceCommandType,
    spliceCommand: number[],
    options: {
        descriptorLoop?: number[];
        encryptedByte?: number;
        spliceCommandLength?: number;
        trailing?: number[];
    } = {},
): number[] => {
    const descriptorLoop = options.descriptorLoop || [];
    const trailing = options.trailing || [];
    const spliceCommandLength = options.spliceCommandLength ?? spliceCommand.length;
    const sectionLength = 11 + spliceCommand.length + 2 + descriptorLoop.length + 4 + trailing.length;

    return [
        0xfc,
        (sectionLength >> 8) & 0x0f,
        sectionLength & 0xff,
        0x00,
        options.encryptedByte || 0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0xff,
        0xf0 | ((spliceCommandLength >> 8) & 0x0f),
        spliceCommandLength & 0xff,
        spliceCommandType,
        ...spliceCommand,
        (descriptorLoop.length >> 8) & 0xff,
        descriptorLoop.length & 0xff,
        ...descriptorLoop,
        0x00,
        0x00,
        0x00,
        0x00,
        ...trailing,
    ];
};

const parseBytes = (scte35: SCTE35, bytes: number[]) => (scte35 as any).parseSCTE35Data(Uint8Array.from(bytes));

describe("SCTE35", () => {
    const scte35: SCTE35 = new SCTE35();
    let consoleWarn: typeof console.warn;
    let consoleError: typeof console.error;

    before(() => {
        consoleWarn = console.warn;
        consoleError = console.error;
        console.warn = () => undefined;
        console.error = () => undefined;
    });

    after(() => {
        console.warn = consoleWarn;
        console.error = consoleError;
    });

    describe("PARSE BASE 64", () => {
        it("should parse from base64", () => {
            const base64 =
                "/DBGAAET8J+pAP/wBQb+AAAAAAAwAi5DVUVJQAErgX+/CR9TSUdOQUw6OGlTdzllUWlGVndBQUFBQUFBQUJCQT09NwMDaJ6RZQ==";
            const spliceInfo = scte35.parseFromB64(base64);
            // Confirms that all 33 bits are read correctly
            expect(spliceInfo.ptsAdjustment).to.eq(4629503913);
        });

        it("should parse from base64", () => {
            const base64 =
                "/DBoAAFDizjpAP/wBQb/ebGh8wBSAhhDVUVJXAJwnn+3AQlIREkwMzA0MDghAQACGkNVRUlcAnC6f/cAAZUdEwEGUFMxODgxNAAAAhpDVUVJXAJwu3/3AAApMbEBBlBTMTg4MTAAABLEqgg=";
            const spliceInfo = scte35.parseFromB64(base64);
            // Confirms that all 33 bits are read correctly
            expect(spliceInfo.ptsAdjustment).to.eq(5428164841);
        });

        it("should parse two descriptors", () => {
            const base64 =
                "/DBfAAHsGNoe///wBQb+F08gCQBJAhxDVUVJxHIBUX//AAEgwfgICAAFH4HEcgFRNAIDAilDVUVJAAAAAH+/DBpWTU5VAV/G7ALs/RHgrKYAJrlBTzABAAAAAAEAAH2eFFg=";
            const spliceInfo = scte35.parseFromB64(base64);
            expect(spliceInfo.descriptors).to.not.equal(undefined);
            if (spliceInfo.descriptors) {
                expect(spliceInfo.descriptors.length).to.eq(2);
            }
        });

        it("should parse scte-35 with private_command()", () => {
            const base64 = "/DA5AAAAAAAAAP/wKP8AAAABZXdvZ0ltMWxjM05oWjJVaU9pQWlZV1JrVjJsa1oyVjBJZ3A5AAAUDmUl";
            const spliceInfo = scte35.parseFromB64(base64);
            const splicePrivate = spliceInfo.spliceCommand as ISplicePrivate;
            expect(splicePrivate.identifier).to.equal(1);
            expect(String.fromCharCode(...new Uint8Array(splicePrivate.rawData))).to.equal(
                "ewogIm1lc3NhZ2UiOiAiYWRkV2lkZ2V0Igp9",
            );
        });

        /*tslint:disable*/
        //TODO: write unit tests for additional property checking on these base64 string
        // it("should parse from another base64", () => {
        //     const base64 = "/DBvAAFDizjpAP/wBQb+K9F+MgBZAhlDVUVJXAL02n+3AQpIRDExMjM0OFQxIQEAAh1DVUVJXAL2U3/3AAGb/KUBCUhEQ00xMDY0ODQAAAIdQ1VFSVwC9lR/9wAAKTGxAQlIRENNMTA2NDgwAADHDHPR";
        //     const spliceInfo = scte35.parseFromB64(base64);
        // });

        // it("should parse yet another base64", () => {
        //     const base64 = "/DBpAAFDizjpAP/wBQb+MSGYXQBTAhdDVUVJXBGNE3+3AQhIRFRQMTg3OTEBAAIYQ1VFSVwRin9/twEJSERDTTExMDczNQAAAh5DVUVJXBGNMX/3AAI4g+0BCkhEMTA4NTExVDQgAQAvzOfd";
        //     const spliceInfo = scte35.parseFromB64(base64);
        // });
        /*tslint:enable*/
    });

    describe("PARSE HEX", () => {
        it("should parse ptsAdjustment", () => {
            const base64 =
                "fc3046000113f09fa900fff00506fe000000000030022e4355454940012b817fbf091f5349474e414c3a386953773965516946567741414141414141414242413d3d370303689e9165";
            const spliceInfo = scte35.parseFromHex(base64);
            // TODO: Confirms that all 33 bits are read correctly
            expect(spliceInfo.ptsAdjustment).to.eq(4629503913);
        });

        it("should parse splice_insert", () => {
            const hex = "/DAlAAAAAAAAAP/wFAUAAqbVf+/+AAAAAH4AUmXAAAAAAAAAdIQsGg==";
            const spliceInfo = scte35.parseFromB64(hex);
            expect((spliceInfo.spliceCommand as any).spliceTime.specified).to.eql(true);
            expect((spliceInfo.spliceCommand as any).breakDuration.duration).to.eql(5400000);
        });

        it("should reject hex data with an invalid section length", () => {
            expect(() => scte35.parseFromHex("not-hex-data")).to.throw();
            expect(() => scte35.parseFromHex("zz")).to.throw();
        });
    });

    describe("UTILITIES", () => {
        it("should parse base64 string Hello World", () => {
            const helloWorld = "SGVsbG8sIFdvcmxkIQ==";
            expect((scte35 as any).parseBase64(helloWorld)).to.equal("Hello, World!");
        });

        it("should parse special message", () => {
            const message =
                "V2UgYXJlIGxvb2tpbmcgZm9yIGNvbnRyaWJ1dG9ycyB0aGF0IHdhbnQgdG8gaGVscCBpbXByb3ZlIHRoaXMgbGlicmFyeSwgd2FudCB0byBoZWxwPw==";
            expect((scte35 as any).parseBase64(message)).to.equal(
                "We are looking for contributors that want to help improve this library, want to help?",
            );
        });

        it("should convert bytes to UUID strings", () => {
            const uuidBytes = Uint8Array.from([
                0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff,
            ]);

            expect(util.bytesToUUID(uuidBytes)).to.equal("00112233-4455-6677-8899-aabbccddeeff");
        });

        it("should reject UUID byte arrays with the wrong size", () => {
            expect(() => util.bytesToUUID(Uint8Array.from([0x00]))).to.throw(
                "scte35-js Uint8Array uuid bad size: 1",
            );
        });

        it("should shift a byte by 32 bits", () => {
            expect(util.shiftThirtyTwoBits(2)).to.equal(8589934592);
        });
    });

    describe("DESCRIPTORS", () => {
        it("should parse descriptor tags that are currently skipped", () => {
            const avail = descriptors.parseDescriptor(toView(makeDescriptor(descriptors.SpliceDescriptorTag.AVAIL_DESCRIPTOR, [0, 0, 0, 1])));
            const dtmf = descriptors.parseDescriptor(
                toView(makeDescriptor(descriptors.SpliceDescriptorTag.DTMF_DESCRIPTOR, [0x05, 0x21, 0x31, 0x32])),
            );
            const time = descriptors.parseDescriptor(
                toView(makeDescriptor(descriptors.SpliceDescriptorTag.TIME_DESCRIPTOR, [0, 0, 0, 0, 0, 0, 0, 0])),
            );
            const unknown = descriptors.parseDescriptor(toView(makeDescriptor(0xff, [])));

            expect(avail.spliceDescriptorTag).to.equal(descriptors.SpliceDescriptorTag.AVAIL_DESCRIPTOR);
            expect(dtmf.spliceDescriptorTag).to.equal(descriptors.SpliceDescriptorTag.DTMF_DESCRIPTOR);
            expect(time.spliceDescriptorTag).to.equal(descriptors.SpliceDescriptorTag.TIME_DESCRIPTOR);
            expect(unknown.spliceDescriptorTag).to.equal(0xff);
        });

        it("should parse segmentation restrictions when delivery is restricted", () => {
            const descriptor = descriptors.parseDescriptor(
                toView(
                    makeDescriptor(descriptors.SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR, [
                        0x00,
                        0x00,
                        0x00,
                        0x01,
                        0x00,
                        0x9e,
                        descriptors.SegmentationUpidType.NOT_USED,
                        0x00,
                        descriptors.SegmentationTypeId.PROGRAM_START,
                        0x01,
                        0x01,
                    ]),
                ),
            ) as descriptors.ISegmentationDescriptor;

            expect(descriptor.deliveryNotRestrictedFlag).to.equal(false);
            expect(descriptor.webDeliveryAllowedFlag).to.equal(true);
            expect(descriptor.noRegionalBlackoutFlag).to.equal(true);
            expect(descriptor.archiveAllowedFlag).to.equal(true);
            expect(descriptor.deviceRestrictions).to.equal(descriptors.SegmentationMessage.RESTRICT_GROUP_2);
        });

        it("should parse component counts, durations, and subsegments", () => {
            const descriptor = descriptors.parseDescriptor(
                toView(
                    makeDescriptor(descriptors.SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR, [
                        0x00,
                        0x00,
                        0x00,
                        0x02,
                        0x00,
                        0x60,
                        0x01,
                        0x11,
                        0x80,
                        0x00,
                        0x00,
                        0x00,
                        0x02,
                        0x81,
                        0x00,
                        0x00,
                        0x00,
                        0x03,
                        descriptors.SegmentationUpidType.USER_DEFINED,
                        0x01,
                        0xab,
                        descriptors.SegmentationTypeId.DISTRIBUTOR_PLACEMENT_OPPORTUNITY_START,
                        0x02,
                        0x03,
                        0x04,
                        0x05,
                    ]),
                ),
            ) as descriptors.ISegmentationDescriptor;

            expect(descriptor.componentCount).to.equal(1);
            expect(descriptor.segmentationDuration).to.equal(554050781187);
            expect(descriptor.segmentationUpid).to.eql(Uint8Array.from([0xab]));
            expect(descriptor.subSegmentNum).to.equal(4);
            expect(descriptor.subSegmentsExpected).to.equal(5);
        });

        it("should log descriptor offset mismatches", () => {
            const descriptor = descriptors.parseDescriptor(
                toView(
                    makeDescriptor(descriptors.SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR, [
                        0x00,
                        0x00,
                        0x00,
                        0x03,
                        0x80,
                        0x00,
                    ]),
                ),
            );

            expect(descriptor.spliceDescriptorTag).to.equal(descriptors.SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR);
        });
    });

    describe("LOW LEVEL SCTE35 SECTIONS", () => {
        it("should parse splice_null sections with legacy command length and encrypted packets", () => {
            const spliceInfo = parseBytes(
                scte35,
                makeSection(SpliceCommandType.SPLICE_NULL, [], {
                    encryptedByte: 0x82,
                    spliceCommandLength: 0x0fff,
                }),
            );

            expect(spliceInfo.encryptedPacket).to.equal(true);
            expect(spliceInfo.encryptedAlgorithm).to.equal(1);
            expect(spliceInfo.spliceCommandLength).to.equal(0);
        });

        it("should reject unsupported legacy command lengths", () => {
            expect(() =>
                parseBytes(
                    scte35,
                    makeSection(SpliceCommandType.PRIVATE_COMMAND, [], {
                        spliceCommandLength: 0x0fff,
                    }),
                ),
            ).to.throw();
        });

        it("should parse legacy time_signal without a specified pts", () => {
            const spliceInfo = parseBytes(
                scte35,
                makeSection(SpliceCommandType.TIME_SIGNAL, [0x00], {
                    spliceCommandLength: 0x0fff,
                }),
            );

            expect(spliceInfo.spliceCommandLength).to.equal(1);
            expect(spliceInfo.spliceCommand).to.eql({ specified: false });
        });

        it("should infer legacy splice_insert lengths for component splice commands", () => {
            expect(() =>
                parseBytes(
                    scte35,
                    makeSection(
                        SpliceCommandType.SPLICE_INSERT,
                        [
                            0x00, 0x00, 0x00, 0x01, 0x00, 0x30, 0x01, 0x11, 0x00, 0x00, 0x00, 0x44, 0x00, 0x02,
                            0x03,
                        ],
                        {
                            spliceCommandLength: 0x0fff,
                        },
                    ),
                ),
            ).to.throw();

            expect(() =>
                parseBytes(
                    scte35,
                    makeSection(
                        SpliceCommandType.SPLICE_INSERT,
                        [
                            0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x01, 0x11, 0x00, 0x00, 0x00, 0x44, 0x00, 0x02,
                            0x03,
                        ],
                        {
                            spliceCommandLength: 0x0fff,
                        },
                    ),
                ),
            ).to.throw();
        });

        it("should parse splice_schedule commands", () => {
            const spliceInfo = parseBytes(
                scte35,
                makeSection(SpliceCommandType.SPLICE_SCHEDULE, [
                    0x02,
                    0x00,
                    0x00,
                    0x00,
                    0x01,
                    0x80,
                    0x00,
                    0x00,
                    0x00,
                    0x02,
                    0x00,
                    0x40,
                    0x00,
                    0x00,
                    0x00,
                    0x09,
                    0x00,
                    0x01,
                    0x02,
                    0x03,
                ]),
            );
            const schedule = spliceInfo.spliceCommand as ISpliceSchedule;

            expect(schedule.spliceCount).to.equal(2);
            expect(schedule.spliceEvents[0].spliceEventCancelIndicator).to.equal(true);
            expect(schedule.spliceEvents[1].utcSpliceTime).to.equal(9);
        });

        it("should parse schedule component splice commands with break durations", () => {
            const spliceInfo = parseBytes(
                scte35,
                makeSection(SpliceCommandType.SPLICE_SCHEDULE, [
                    0x01,
                    0x00,
                    0x00,
                    0x00,
                    0x03,
                    0x00,
                    0x20,
                    0x01,
                    0x22,
                    0x00,
                    0x00,
                    0x00,
                    0x0a,
                    0x81,
                    0x00,
                    0x00,
                    0x00,
                    0x04,
                    0x00,
                    0x05,
                    0x06,
                    0x07,
                ]),
            );
            const schedule = spliceInfo.spliceCommand as ISpliceSchedule;

            expect(schedule.spliceEvents[0].utcSpliceComponents).to.eql([{ componentTag: 0x22, utcSpliceTime: 10 }]);
            expect(schedule.spliceEvents[0].breakDuration?.duration).to.equal(4294967300);
        });

        it("should parse private commands without payload when the identifier is zero", () => {
            const spliceInfo = parseBytes(scte35, makeSection(SpliceCommandType.PRIVATE_COMMAND, [0, 0, 0, 0]));
            const privateCommand = spliceInfo.spliceCommand as ISplicePrivate;

            expect(privateCommand.identifier).to.equal(0);
            expect(privateCommand.rawData).to.equal(undefined);
        });

        it("should recover from malformed descriptors and report trailing bytes", () => {
            const spliceInfo = parseBytes(
                scte35,
                makeSection(SpliceCommandType.SPLICE_NULL, [], {
                    descriptorLoop: [descriptors.SpliceDescriptorTag.SEGMENTATION_DESCRIPTOR],
                    trailing: [0xff],
                }),
            );

            expect(spliceInfo.descriptors).to.eql([]);
        });

        it("should report low-level splice command size mismatches", () => {
            expect((scte35 as any).spliceSchedule(toView([0x00, 0x00]))).to.eql({ spliceCount: 0, spliceEvents: [] });

            const insert = (scte35 as any).spliceInsert(
                toView([0x00, 0x00, 0x00, 0x01, 0x80, 0xff]),
            ) as ISpliceInsertEvent;
            expect(insert.spliceEventCancelIndicator).to.equal(true);
        });

        it("should reject sections with incorrect section lengths", () => {
            expect(() => parseBytes(scte35, [0xfc, 0x00, 0x01])).to.throw(
                "Binary read error sectionLength: 1 + 3 !== data.length: 3",
            );
        });
    });

    describe("Legacy splice_command_length==0x0fff", () => {
        it("should parse time_signal", () => {
            const base64 = "/DA6AAAAAAAAAP///wb+GIZQCAAkAiJDVUVJAAv9L3//AAFeMHAMDkRJU0M2NzQ5NjNfOTk4MAEBsXXbjg";
            const spliceInfo = scte35.parseFromB64(base64);
            expect(spliceInfo.spliceCommandType).to.equal(SpliceCommandType.TIME_SIGNAL);
            const spliceCommand = spliceInfo.spliceCommand as ISpliceTime;
            expect(spliceCommand.pts).to.equal(411455496);

            expect(spliceInfo.descriptors).to.not.equal(undefined);
            expect(spliceInfo.descriptors?.length).to.equal(1);
            if (spliceInfo.descriptors) {
                expect(spliceInfo.descriptors[0].identifier).to.equal("CUEI");
                const spliceDescriptor = spliceInfo.descriptors[0] as descriptors.ISegmentationDescriptor;
                expect(spliceDescriptor.segmentationDuration).to.eq(22950000);
                expect(spliceDescriptor.segmentationTypeId).to.eq(48);
            }
        });

        it("should parse splice_insert", () => {
            const base64 = "/DAxAAAAAAAAAP///wUAhcJPf+/+zBS4Ln4AUmXAAAAAAAAMAQpDVUVJAJ8wNDgq0FP4ig";
            const spliceInfo = scte35.parseFromB64(base64);
            expect(spliceInfo.spliceCommandType).to.equal(SpliceCommandType.SPLICE_INSERT);
            const spliceCommand = spliceInfo.spliceCommand as ISpliceInsertEvent;
            expect(spliceCommand.spliceEventId).to.equal(8766031);
            expect(spliceCommand.spliceTime?.pts).to.equal(3423909934);
            expect(spliceCommand.breakDuration?.duration).to.equal(5400000);

            expect(spliceInfo.descriptors).to.not.equal(undefined);
            expect(spliceInfo.descriptors?.length).to.equal(1);
            if (spliceInfo.descriptors) {
                expect(spliceInfo.descriptors[0].identifier).to.equal("CUEI");
            }
        });
    });
});
