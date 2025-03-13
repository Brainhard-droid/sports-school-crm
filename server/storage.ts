async updateBulkAttendance(
    groupId: number,
    date: string,
    status: keyof typeof AttendanceStatus
  ): Promise<Attendance[]> {
    try {
      const students = await this.getGroupStudentsWithDetails(groupId);
      const results: Attendance[] = [];

      // Используем Promise.all для параллельного выполнения обновлений
      await Promise.all(students.map(async (student) => {
        const [existingAttendance] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.studentId, student.id),
              eq(attendance.groupId, groupId),
              eq(attendance.date, date)
            )
          );

        let result;
        if (existingAttendance) {
          [result] = await db
            .update(attendance)
            .set({ status })
            .where(eq(attendance.id, existingAttendance.id))
            .returning();
        } else {
          [result] = await db
            .insert(attendance)
            .values({
              studentId: student.id,
              groupId,
              date,
              status,
            })
            .returning();
        }
        results.push(result);
      }));

      return results;
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      throw error;
    }
  }