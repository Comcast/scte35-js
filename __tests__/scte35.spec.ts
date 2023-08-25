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
import { ISpliceInsertEvent, ISpliceTime, ISplicePrivate, SpliceCommandType } from "../src/ISCTE35";
import * as descriptors from "../src/descriptors";

describe("SCTE35", () => {
    const scte35: SCTE35 = new SCTE35();

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
    });

    describe("Legacy splice_command_length==0x0fff", () => {
        it("should parse time_signal", () => {
            const base64 =
		"/DA6AAAAAAAAAP///wb+GIZQCAAkAiJDVUVJAAv9L3//AAFeMHAMDkRJU0M2NzQ5NjNfOTk4MAEBsXXbjg";
            const spliceInfo = scte35.parseFromB64(base64);
            expect(spliceInfo.spliceCommandType).to.equal(SpliceCommandType.TIME_SIGNAL);
	    const spliceCommand = spliceInfo.spliceCommand as ISpliceTime;
	    expect(spliceCommand.pts).to.equal(411455496);

            expect(spliceInfo.descriptors).to.not.equal(undefined);
            expect(spliceInfo.descriptors?.length).to.equal(1);
	    if (spliceInfo.descriptors) {
            	expect(spliceInfo.descriptors[0].indentifier).to.equal("CUEI");
		const spliceDescriptor=(spliceInfo.descriptors[0] as descriptors.ISegmentationDescriptor);
            	expect(spliceDescriptor.segmentationDuration).to.eq(22950000);
            	expect(spliceDescriptor.segmentationTypeId).to.eq(48);
	    }
        });

        it("should parse splice_insert", () => {
            const base64 =
		"/DAxAAAAAAAAAP///wUAhcJPf+/+zBS4Ln4AUmXAAAAAAAAMAQpDVUVJAJ8wNDgq0FP4ig";
            const spliceInfo = scte35.parseFromB64(base64);
            expect(spliceInfo.spliceCommandType).to.equal(SpliceCommandType.SPLICE_INSERT);
	    const spliceCommand = spliceInfo.spliceCommand as ISpliceInsertEvent;
	    expect(spliceCommand.spliceEventId).to.equal(8766031);
	    expect(spliceCommand.spliceTime?.pts).to.equal(3423909934);
	    expect(spliceCommand.breakDuration?.duration).to.equal(5400000);

            expect(spliceInfo.descriptors).to.not.equal(undefined);
            expect(spliceInfo.descriptors?.length).to.equal(1);
	    if (spliceInfo.descriptors) {
            	expect(spliceInfo.descriptors[0].indentifier).to.equal("CUEI");
	    }
        });
    });
});
