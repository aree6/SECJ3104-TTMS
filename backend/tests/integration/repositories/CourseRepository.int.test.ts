import { dependencyTokens } from "@/dependencies/tokens";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IAnalyticsCourse,
} from "@/types";
import {
    cleanupSecondaryTables,
    createTestContainer,
    seededPrimaryData,
    seeders,
} from "@test/setup";

describe("CourseRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.courseRepository);

    describe("getByCode", () => {
        it("Should return null if course does not exist", async () => {
            const course = await repository.getByCode("CS101");

            expect(course).toBeNull();
        });

        it("Should return course if it exists", async () => {
            const fetchedCourse = await repository.getByCode("SECJ1013");

            expect(fetchedCourse).toEqual(seededPrimaryData.courses[0]);
        });
    });

    describe("getSchedulesForAnalytics", () => {
        const session = seededPrimaryData.sessions[0];
        const course = seededPrimaryData.courses[0];
        const venue = seededPrimaryData.venues[0];

        beforeAll(async () => {
            const otherSession = seededPrimaryData.sessions[1];

            const [section, otherSection] =
                await seeders.courseSection.seedMany(
                    {
                        courseCode: course.code,
                        section: "1",
                        session: session.session,
                        semester: session.semester,
                    },
                    // Should not be returned in analytics.
                    {
                        courseCode: course.code,
                        section: "2",
                        session: otherSession.session,
                        semester: otherSession.semester,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    courseCode: section.courseCode,
                    session: section.session,
                    semester: section.semester,
                    section: section.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                    venueCode: venue.code,
                },
                // Should not be returned in analytics.
                {
                    courseCode: otherSection.courseCode,
                    session: otherSection.session,
                    semester: otherSection.semester,
                    section: otherSection.section,
                    day: CourseSectionScheduleDay.tuesday,
                    time: CourseSectionScheduleTime.time3,
                    venueCode: venue.code,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        it("Should return course section schedules for analytics", async () => {
            const schedules = await repository.getSchedulesForAnalytics(
                session.session,
                session.semester
            );

            expect(schedules).toHaveLength(1);

            expect(schedules[0]).toEqual({
                course: { code: course.code, name: course.name },
                section: "1",
                schedules: [
                    {
                        day: CourseSectionScheduleDay.monday,
                        time: CourseSectionScheduleTime.time2,
                        venue: { shortName: venue.shortName },
                    },
                ],
            } satisfies IAnalyticsCourse);
        });
    });
});
