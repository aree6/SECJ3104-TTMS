import { beforeEach, describe, expect, it } from "vitest";
import { StudentController } from "../../src/controllers/StudentController";
import { IStudentSearchEntry, ITimetable } from "../../src/types";
import {
    createFailedOperationResultMock,
    createSuccessfulOperationResultMock,
    mockStudentService,
} from "../mocks";
import {
    createMockRequest,
    createMockResponse,
} from "../mocks/expressMockFactory";

describe("StudentController", () => {
    let controller: StudentController;
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        controller = new StudentController(mockStudentService);
        mockResponse = createMockResponse();
    });

    describe("getTimetable", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            matric_no: string;
        }>;

        type Res = ITimetable[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { semester: "2023/2024", matric_no: "C0000000" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", matric_no: "C0000000" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if matric number is missing", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", semester: "1" },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Matric number is required.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return error if timetable retrieval operation fails", async () => {
            const result = createFailedOperationResultMock(
                "Internal server error",
                500
            );

            mockStudentService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });

        it("Should return timetable if retrieval is successful", async () => {
            const mockTimetable: ITimetable[] = [];
            const result = createSuccessfulOperationResultMock(mockTimetable);

            mockStudentService.getTimetable.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTimetable);
        });

        it("Should return 500 if timetable retrieval throws an error", async () => {
            mockStudentService.getTimetable.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<
                "/timetable",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    matric_no: "C0000000",
                },
            });

            await controller.getTimetable(mockRequest, mockResponse);

            expect(mockStudentService.getTimetable).toHaveBeenCalledWith(
                "C0000000",
                "2023/2024",
                1
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });

    describe("search", () => {
        type Req = Partial<{
            session: string;
            semester: string;
            query: string;
            limit: string;
            offset: string;
        }>;

        type Res = IStudentSearchEntry[] | { error: string };

        it("Should return 400 if session is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { semester: "2023/2024", query: "C0000000" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Academic session is required.",
            });
        });

        it("Should return 400 if semester is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: { session: "2023/2024", query: "C0000000" },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Semester is required.",
            });
        });

        it("Should return 400 if session format is invalid", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023-2024",
                    semester: "1",
                    query: "test",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });
        });

        it("Should return 400 if semester is invalid", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "4",
                    query: "test",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });
        });

        it("Should return 400 if query is missing", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Query is required",
            });
        });

        it("Should return 400 if limit is not a number", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "not-a-number",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid limit",
            });
        });

        it("Should return 400 if limit is less than 0", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "-1",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid limit",
            });
        });

        it("Should return 400 if offset is not a number", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    offset: "not-a-number",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid offset",
            });
        });

        it("Should return 400 if offset is less than 0", async () => {
            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    offset: "-1",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Invalid offset",
            });
        });

        it("Should return error if search operation fails", async () => {
            const result = createFailedOperationResultMock(
                "Internal server error",
                500
            );

            mockStudentService.search.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
                "John",
                10,
                0
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });

        it("Should return search results if operation is successful", async () => {
            const mockSearchResults: IStudentSearchEntry[] = [
                { matricNo: "C0000001", name: "John Doe", courseCode: "SECJH" },
                {
                    matricNo: "C0000002",
                    name: "Jane Smith",
                    courseCode: "SECVH",
                },
            ];

            const result =
                createSuccessfulOperationResultMock(mockSearchResults);

            mockStudentService.search.mockResolvedValueOnce(result);

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
                "John",
                10,
                0
            );

            expect(result.isSuccessful).toHaveBeenCalled();
            expect(result.failed).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
        });

        it("Should return 500 if search throws an error", async () => {
            mockStudentService.search.mockRejectedValueOnce(
                new Error("Unexpected error")
            );

            const mockRequest = createMockRequest<
                "/search",
                Res,
                Record<string, unknown>,
                Req
            >({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "John",
                    limit: "10",
                    offset: "0",
                },
            });

            await controller.search(mockRequest, mockResponse);

            expect(mockStudentService.search).toHaveBeenCalledWith(
                "2023/2024",
                1,
                "John",
                10,
                0
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
