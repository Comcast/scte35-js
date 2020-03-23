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
export interface ISpliceScheduleEvent extends ISpliceEvent {
    utcSpliceTime?: number;
    utcSpliceComponents?: IUTCSpliceComponent[];
}
export interface ISpliceSchedule {
    spliceCount: number;
    spliceEvents: ISpliceScheduleEvent[];
}
export interface ISpliceTimeComponent extends ISpliceComponent {
    spliceTime: number;
}
export interface ISpliceInsertEvent extends ISpliceEvent {
    spliceImmediateFlag?: boolean;
    spliceTime?: ISpliceTime;
    spliceTimeComponents?: ISpliceTimeComponent[];
}
export interface ISpliceTime {
    specified: boolean;
    pts?: number;
}
export interface ISCTE35 {
    /**
     * DASH as defined in SCTE 214-1 2016
     * Data should be from the @schemeIdUri="urn:scte:scte35:2014:xml+bin"
     * of an Signal.Binary element in the Event
     */
    parseFromB64: (b64: string) => ISpliceInfoSection;
    parseFromHex: (hex: string) => ISpliceInfoSection;
}
export interface ISpliceInfoSection {
    tableId?: number;
    selectionSyntaxIndicator?: boolean;
    privateIndicator?: boolean;
    sectionLength?: number;
    protocolVersion?: number;
    encryptedPacket?: boolean;
    encryptedAlgorithm?: number;
    ptsAdjustment?: number;
    cwIndex?: number;
    tier?: number;
    spliceCommandLength?: number;
    spliceCommandType?: SpliceCommandType;
    spliceCommand?: SpliceCommand;
    descriptorLoopLength?: number;
    descriptors?: descriptors.ISpliceDescriptor[];
    crc?: number;
}
export declare const enum SpliceCommandType {
    SPLICE_NULL = 0,
    SPLICE_SCHEDULE = 4,
    SPLICE_INSERT = 5,
    TIME_SIGNAL = 6,
    BANDWIDTH_RESERVATION = 7,
    PRIVATE_COMMAND = 255
}
export declare type SpliceEvent = ISpliceScheduleEvent | ISpliceInsertEvent;
export declare type EventTag = SpliceCommandType.SPLICE_SCHEDULE | SpliceCommandType.SPLICE_INSERT;
export declare type SpliceCommand = ISpliceSchedule | ISpliceInsertEvent | ISpliceTime;
