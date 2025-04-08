//import { IStorage } from '../interfaces/storage';
import { BaseStorage } from './BaseStorage';
import { UserStorage } from './UserStorage';
import { BranchStorage } from './BranchStorage';
import { SectionStorage } from './SectionStorage';
import { BranchSectionStorage } from './BranchSectionStorage';
import { TrialRequestStorage } from './TrialRequestStorage';
import { StudentStorage } from './StudentStorage';
import { GroupStorage } from './GroupStorage';
import { StudentGroupStorage } from './StudentGroupStorage';
import { AttendanceStorage } from './AttendanceStorage';
import { DateCommentStorage } from './DateCommentStorage';

/**
 * Класс для объединения всех хранилищ
 * Реализует полный интерфейс хранилища данных
 */
export class PostgresStorage 
  extends BaseStorage {
  
  // Объявление методов, делегируемых соответствующим хранилищам
  // User Storage
  getUser: UserStorage['getUser'];
  getUserByUsername: UserStorage['getUserByUsername'];
  createUser: UserStorage['createUser'];
  
  // Branch Storage
  getAllBranches: BranchStorage['getAllBranches'];
  getBranchById: BranchStorage['getBranchById'];
  createBranch: BranchStorage['createBranch'];
  updateBranch: BranchStorage['updateBranch'];
  deleteBranch: BranchStorage['deleteBranch'];
  
  // Section Storage
  getAllSections: SectionStorage['getAllSections'];
  getSectionById: SectionStorage['getSectionById'];
  createSection: SectionStorage['createSection'];
  updateSection: SectionStorage['updateSection'];
  deleteSection: SectionStorage['deleteSection'];
  
  // Branch Section Storage
  getAllBranchSections: BranchSectionStorage['getAllBranchSections'];
  getBranchSectionById: BranchSectionStorage['getBranchSectionById'];
  getBranchSectionsByBranchId: BranchSectionStorage['getBranchSectionsByBranchId'];
  getBranchSectionsBySectionId: BranchSectionStorage['getBranchSectionsBySectionId'];
  createBranchSection: BranchSectionStorage['createBranchSection'];
  updateBranchSection: BranchSectionStorage['updateBranchSection'];
  deleteBranchSection: BranchSectionStorage['deleteBranchSection'];
  updateBranchSectionSchedule: BranchSectionStorage['updateBranchSectionSchedule'];
  
  // Trial Request Storage
  getAllTrialRequests: TrialRequestStorage['getAllTrialRequests'];
  getTrialRequestsByStatus: TrialRequestStorage['getTrialRequestsByStatus'];
  getTrialRequestById: TrialRequestStorage['getTrialRequestById'];
  createTrialRequest: TrialRequestStorage['createTrialRequest'];
  updateTrialRequestStatus: TrialRequestStorage['updateTrialRequestStatus'];
  updateTrialRequest: TrialRequestStorage['updateTrialRequest'];
  
  // Student Storage
  getAllStudents: StudentStorage['getAllStudents'];
  getStudentById: StudentStorage['getStudentById'];
  createStudent: StudentStorage['createStudent'];
  updateStudent: StudentStorage['updateStudent'];
  deleteStudent: StudentStorage['deleteStudent'];
  
  // Group Storage
  getGroups: GroupStorage['getGroups'];
  getGroup: GroupStorage['getGroup'];
  createGroup: GroupStorage['createGroup'];
  getGroupStudentsWithDetails: GroupStorage['getGroupStudentsWithDetails'];
  deleteGroup: GroupStorage['deleteGroup'];
  
  // Student Group Storage
  getStudentGroups: StudentGroupStorage['getStudentGroups'];
  getGroupStudents: StudentGroupStorage['getGroupStudents'];
  addStudentToGroup: StudentGroupStorage['addStudentToGroup'];
  removeStudentFromGroup: StudentGroupStorage['removeStudentFromGroup'];
  getStudentGroupByIds: StudentGroupStorage['getStudentGroupByIds'];
  createStudentGroup: StudentGroupStorage['createStudentGroup'];
  updateStudentGroup: StudentGroupStorage['updateStudentGroup'];
  
  // Attendance Storage
  getAttendance: AttendanceStorage['getAttendance'];
  createAttendance: AttendanceStorage['createAttendance'];
  getAttendanceByMonth: AttendanceStorage['getAttendanceByMonth'];
  getAttendanceById: AttendanceStorage['getAttendanceById'];
  updateAttendance: AttendanceStorage['updateAttendance'];
  
  // Date Comment Storage
  getDateComments: DateCommentStorage['getDateComments'];
  createDateComment: DateCommentStorage['createDateComment'];
  getDateCommentById: DateCommentStorage['getDateCommentById'];
  getDateComment: DateCommentStorage['getDateComment'];
  updateDateComment: DateCommentStorage['updateDateComment'];
  deleteDateComment: DateCommentStorage['deleteDateComment'];
  
  // Приватные инстансы хранилищ
  private userStorage: UserStorage;
  private branchStorage: BranchStorage;
  private sectionStorage: SectionStorage;
  private branchSectionStorage: BranchSectionStorage;
  private trialRequestStorage: TrialRequestStorage;
  private studentStorage: StudentStorage;
  private groupStorage: GroupStorage;
  private studentGroupStorage: StudentGroupStorage;
  private attendanceStorage: AttendanceStorage;
  private dateCommentStorage: DateCommentStorage;
  
  constructor() {
    super();
    
    // Создаем инстансы хранилищ
    this.userStorage = new UserStorage();
    this.branchStorage = new BranchStorage();
    this.sectionStorage = new SectionStorage();
    this.branchSectionStorage = new BranchSectionStorage();
    this.trialRequestStorage = new TrialRequestStorage();
    this.studentStorage = new StudentStorage();
    this.groupStorage = new GroupStorage();
    this.studentGroupStorage = new StudentGroupStorage();
    this.attendanceStorage = new AttendanceStorage();
    this.dateCommentStorage = new DateCommentStorage();
    
    // Привязываем методы к соответствующим реализациям
    this.getUser = this.userStorage.getUser.bind(this.userStorage);
    this.getUserByUsername = this.userStorage.getUserByUsername.bind(this.userStorage);
    this.createUser = this.userStorage.createUser.bind(this.userStorage);
    
    this.getAllBranches = this.branchStorage.getAllBranches.bind(this.branchStorage);
    this.getBranchById = this.branchStorage.getBranchById.bind(this.branchStorage);
    this.createBranch = this.branchStorage.createBranch.bind(this.branchStorage);
    this.updateBranch = this.branchStorage.updateBranch.bind(this.branchStorage);
    this.deleteBranch = this.branchStorage.deleteBranch.bind(this.branchStorage);
    
    this.getAllSections = this.sectionStorage.getAllSections.bind(this.sectionStorage);
    this.getSectionById = this.sectionStorage.getSectionById.bind(this.sectionStorage);
    this.createSection = this.sectionStorage.createSection.bind(this.sectionStorage);
    this.updateSection = this.sectionStorage.updateSection.bind(this.sectionStorage);
    this.deleteSection = this.sectionStorage.deleteSection.bind(this.sectionStorage);
    
    this.getAllBranchSections = this.branchSectionStorage.getAllBranchSections.bind(this.branchSectionStorage);
    this.getBranchSectionById = this.branchSectionStorage.getBranchSectionById.bind(this.branchSectionStorage);
    this.getBranchSectionsByBranchId = this.branchSectionStorage.getBranchSectionsByBranchId.bind(this.branchSectionStorage);
    this.getBranchSectionsBySectionId = this.branchSectionStorage.getBranchSectionsBySectionId.bind(this.branchSectionStorage);
    this.createBranchSection = this.branchSectionStorage.createBranchSection.bind(this.branchSectionStorage);
    this.updateBranchSection = this.branchSectionStorage.updateBranchSection.bind(this.branchSectionStorage);
    this.deleteBranchSection = this.branchSectionStorage.deleteBranchSection.bind(this.branchSectionStorage);
    this.updateBranchSectionSchedule = this.branchSectionStorage.updateBranchSectionSchedule.bind(this.branchSectionStorage);
    
    this.getAllTrialRequests = this.trialRequestStorage.getAllTrialRequests.bind(this.trialRequestStorage);
    this.getTrialRequestsByStatus = this.trialRequestStorage.getTrialRequestsByStatus.bind(this.trialRequestStorage);
    this.getTrialRequestById = this.trialRequestStorage.getTrialRequestById.bind(this.trialRequestStorage);
    this.createTrialRequest = this.trialRequestStorage.createTrialRequest.bind(this.trialRequestStorage);
    this.updateTrialRequestStatus = this.trialRequestStorage.updateTrialRequestStatus.bind(this.trialRequestStorage);
    this.updateTrialRequest = this.trialRequestStorage.updateTrialRequest.bind(this.trialRequestStorage);
    
    this.getAllStudents = this.studentStorage.getAllStudents.bind(this.studentStorage);
    this.getStudentById = this.studentStorage.getStudentById.bind(this.studentStorage);
    this.createStudent = this.studentStorage.createStudent.bind(this.studentStorage);
    this.updateStudent = this.studentStorage.updateStudent.bind(this.studentStorage);
    this.deleteStudent = this.studentStorage.deleteStudent.bind(this.studentStorage);
    
    this.getGroups = this.groupStorage.getGroups.bind(this.groupStorage);
    this.getGroup = this.groupStorage.getGroup.bind(this.groupStorage);
    this.createGroup = this.groupStorage.createGroup.bind(this.groupStorage);
    this.getGroupStudentsWithDetails = this.groupStorage.getGroupStudentsWithDetails.bind(this.groupStorage);
    this.deleteGroup = this.groupStorage.deleteGroup.bind(this.groupStorage);
    
    this.getStudentGroups = this.studentGroupStorage.getStudentGroups.bind(this.studentGroupStorage);
    this.getGroupStudents = this.studentGroupStorage.getGroupStudents.bind(this.studentGroupStorage);
    this.addStudentToGroup = this.studentGroupStorage.addStudentToGroup.bind(this.studentGroupStorage);
    this.removeStudentFromGroup = this.studentGroupStorage.removeStudentFromGroup.bind(this.studentGroupStorage);
    this.getStudentGroupByIds = this.studentGroupStorage.getStudentGroupByIds.bind(this.studentGroupStorage);
    this.createStudentGroup = this.studentGroupStorage.createStudentGroup.bind(this.studentGroupStorage);
    this.updateStudentGroup = this.studentGroupStorage.updateStudentGroup.bind(this.studentGroupStorage);
    
    // Привязываем методы хранилища посещаемости
    this.getAttendance = this.attendanceStorage.getAttendance.bind(this.attendanceStorage);
    this.createAttendance = this.attendanceStorage.createAttendance.bind(this.attendanceStorage);
    this.getAttendanceByMonth = this.attendanceStorage.getAttendanceByMonth.bind(this.attendanceStorage);
    this.getAttendanceById = this.attendanceStorage.getAttendanceById.bind(this.attendanceStorage);
    this.updateAttendance = this.attendanceStorage.updateAttendance.bind(this.attendanceStorage);
    
    // Привязываем методы хранилища комментариев к датам
    this.getDateComments = this.dateCommentStorage.getDateComments.bind(this.dateCommentStorage);
    this.createDateComment = this.dateCommentStorage.createDateComment.bind(this.dateCommentStorage);
    this.getDateCommentById = this.dateCommentStorage.getDateCommentById.bind(this.dateCommentStorage);
    this.getDateComment = this.dateCommentStorage.getDateComment.bind(this.dateCommentStorage);
    this.updateDateComment = this.dateCommentStorage.updateDateComment.bind(this.dateCommentStorage);
    this.deleteDateComment = this.dateCommentStorage.deleteDateComment.bind(this.dateCommentStorage);
  }
}

// Экспортируем инстанс основного хранилища
export const storage = new PostgresStorage();