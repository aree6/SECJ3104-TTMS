"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { ClassItem } from "@/types/timetable"
import { 
  processClasses, 
  hasClash, 
  renderGapAndLunch, 
  GapInfo, 
  getCurrentDay, 
  WEEKDAYS, 
  type Weekday,
  formatTime,
  calculateDuration
} from "@/lib/timetable-utils"
import { useRouter } from "next/navigation"

interface TimetableViewProps {
  classes: ClassItem[]
  selectedDay?: Weekday
  onDaySelect?: (day: Weekday) => void
  showDaySelector?: boolean
  userType: "student" | "lecturer"
  onLecturerClick?: (workerNo: string, lecturerName: string) => void
  lecturerName?: string
}

export function TimetableView({ 
  classes, 
  selectedDay: propSelectedDay,
  onDaySelect,
  showDaySelector = true,
  userType,
  onLecturerClick,
  lecturerName
}: TimetableViewProps) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<Weekday>(propSelectedDay as Weekday || getCurrentDay())

  const handleDaySelect = (day: Weekday) => {
    setSelectedDay(day)
    onDaySelect?.(day)
  }

  // Process classes using shared utility
  const processedClasses = useMemo(() => processClasses(classes), [classes])

  // Render day selector
  const renderDaySelector = () => {
    if (!showDaySelector) return null

    return (
      <div className="flex space-x-2 overflow-x-auto">
        {WEEKDAYS.map((day) => {
          const iconUrl = `https://img.icons8.com/sf-black-filled/100/9a231b/${day.toLowerCase()}.png`

          return (
            <button
              key={day}
              className={`flex flex-col items-center p-1 w-16 transition-all duration-200 ease-in-out ${
                selectedDay === day
                  ? "border-b-2 border-[#9A231B] text-[#9A231B] rounded-t-md rounded-b-none"
                  : "text-gray-700 hover:bg-gray-100 rounded-md"
              }`}
              onClick={() => handleDaySelect(day)}
            >
              <img src={iconUrl} alt={day} className="h-10 w-10 mb-1" />
            </button>
          )
        })}
      </div>
    )
  }

  // Render gap info
  const renderGapInfo = (gapInfo: GapInfo) => {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {gapInfo.type === 'lunch' && (
          <div className="flex items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        )}
        {gapInfo.type === 'mixed' && (
          <>
            {gapInfo.gapBeforeLunch && (
              <div className="flex flex-col items-center gap-1">
                <div className={`inline-block ${userType === 'lecturer' ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600'} px-3 py-1 rounded text-xs font-medium border border-gray-200`}>
                  {`${gapInfo.gapBeforeLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
                </div>
                <div className="text-xs text-green-600">+</div>
              </div>
            )}
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            {gapInfo.gapAfterLunch && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-green-600">+</div>
                <div className={`inline-block ${userType === 'lecturer' ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600'} px-3 py-1 rounded text-xs font-medium border border-gray-200`}>
                  {`${gapInfo.gapAfterLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
                </div>
              </div>
            )}
          </>
        )}
        {gapInfo.type === 'after_lunch' && (
          <>
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="mx-4 text-sm text-green-500 font-medium">1 hr lunch break</div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            {gapInfo.gapAfterLunch && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-green-600">+</div>
                <div className={`inline-block ${userType === 'lecturer' ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600'} px-3 py-1 rounded text-xs font-medium border border-gray-200`}>
                  {`${gapInfo.gapAfterLunch} hr ${userType === 'student' ? 'gap' : 'free'}`}
                </div>
              </div>
            )}
          </>
        )}
        {gapInfo.type === 'gap' && gapInfo.duration && (
          <div className={`inline-block ${userType === 'lecturer' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} px-3 py-1 rounded text-xs font-medium border border-gray-200`}>
            {`${gapInfo.duration} hr ${userType === 'student' ? 'gap' : 'free'}`}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {userType === "lecturer" && lecturerName && (
        <div className="text-center">
          <h2 className="text-l font-semibold text-blue-700">{lecturerName}'s Timetable</h2>
        </div>
      )}
      {renderDaySelector()}

      <div className="space-y-3">
        {processedClasses[selectedDay]?.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No classes scheduled for {selectedDay}
            </CardContent>
          </Card>
        ) : (
          processedClasses[selectedDay]
            ?.sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((classItem, index, array) => {
              const hasClashHighlight = hasClash(classItem, processedClasses[selectedDay])
              
              return (
                <React.Fragment key={classItem.id}>
                  {index > 0 && (() => {
                    const gapInfo = renderGapAndLunch(array[index - 1].endTime, classItem.startTime, userType)
                    if (!gapInfo) return null
                    return renderGapInfo(gapInfo)
                  })()}

                  <Card className={`overflow-hidden ${hasClashHighlight ? "border-red-300" : ""}`}>
                    <CardContent className="p-0">
                      <div className={`flex ${hasClashHighlight ? "bg-red-50" : "bg-white"}`}>
                        {/* Time Section */}
                        <div className="flex flex-col items-center justify-between p-4 border-r border-gray-200 min-w-[80px]">
                          <div className="font-bold text-xs text-gray-700">{formatTime(classItem.startTime)}</div>
                          <div className="relative flex-grow flex items-center justify-center w-full my-2">
                            <div className="absolute w-0.5 h-full bg-gray-200 left-1/2 transform -translate-x-1/2"></div>
                            <div className={`bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-gray-200 z-10 ${userType === 'lecturer' ? 'scale-75 text-xs' : 'scale-100 text-s'}`}>
                              {`${calculateDuration(classItem.startTime, classItem.endTime)} hr`}
                            </div>
                          </div>
                          <div className="font-bold text-xs text-gray-700">{formatTime(classItem.endTime)}</div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-grow p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            {classItem.course.split(' - ')[1] || classItem.course}
                          </h4>
                          <div className="flex gap-5 mb-3">
                            <span className="text-sm text-gray-600">{classItem.courseCode}-{classItem.section.padStart(2, '0')}</span>
                            <span className="text-sm text-gray-600">{classItem.venue}</span>
                          </div>
                          {userType === 'student' ? (
                            <>
                              <hr className="border-gray-200 my-3" />
                              <div className="text-xs text-gray-500 mb-1">Lecturer</div>
                              <button
                                onClick={() => {
                                  const lecturer = classItem.courseSection?.lecturer
                                  if (lecturer?.workerNo) {
                                    onLecturerClick?.(String(lecturer.workerNo), lecturer.name)
                                  }
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {classItem.courseSection?.lecturer?.name || 'TBA'}
                              </button>
                            </>
                          ) : null}
                          {hasClashHighlight && (
                            <Badge variant="destructive" className="absolute top-4 right-4 text-xs">
                              Clash
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              )
            })
        )}
      </div>
    </div>
  )
} 