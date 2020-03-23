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
import { ISpliceInfoSection, ISCTE35 } from "./ISCTE35";
export declare class SCTE35 implements ISCTE35 {
    /***********************************************************************************
     *                               PUBLIC METHODS
     **********************************************************************************/
    /**
     * Parses SCTE35 data from a base64 encoded string
     * @param b64 {string}
     */
    parseFromB64(b64: string): ISpliceInfoSection;
    /**
     * Parses SCTE35 data from a hexidecimal encoded string
     * @param hex {string}
     */
    parseFromHex(hex: string): ISpliceInfoSection;
    /***********************************************************************************
     *                               PRIVATE METHODS
     **********************************************************************************/
    private spliceEvent;
    /**
     * 9.3.2 splice_schedule()
     */
    private spliceSchedule;
    /**
     * 9.3.3 splice_insert()
     */
    private spliceInsert;
    /**
     * 9.4.1 splice_time()
     */
    /**
     *
     * 9.3.4 time_signal is a single splice_time (9.4.1)
     * so it can also be used in splice_insert
     *
     */
    private timeSignal;
    private parseSCTE35Data;
}
