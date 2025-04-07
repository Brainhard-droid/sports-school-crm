import { IStorage } from '../interfaces/storage';
import { BaseStorage } from './BaseStorage';
import { UserStorage } from './UserStorage';
import { BranchStorage } from './BranchStorage';
import { SectionStorage } from './SectionStorage';
import { BranchSectionStorage } from './BranchSectionStorage';
import { TrialRequestStorage } from './TrialRequestStorage';
import { StudentStorage } from './StudentStorage';

/**
 * Класс для объединения всех хранилищ
 * Реализует полный интерфейс хранилища данных
 */
export class PostgresStorage 
  extends BaseStorage
  implements IStorage {
  
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
  
  // Приватные инстансы хранилищ
  private userStorage: UserStorage;
  private branchStorage: BranchStorage;
  private sectionStorage: SectionStorage;
  private branchSectionStorage: BranchSectionStorage;
  private trialRequestStorage: TrialRequestStorage;
  private studentStorage: StudentStorage;
  
  constructor() {
    super();
    
    // Создаем инстансы хранилищ
    this.userStorage = new UserStorage();
    this.branchStorage = new BranchStorage();
    this.sectionStorage = new SectionStorage();
    this.branchSectionStorage = new BranchSectionStorage();
    this.trialRequestStorage = new TrialRequestStorage();
    this.studentStorage = new StudentStorage();
    
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
  }
}

// Экспортируем инстанс основного хранилища
export const storage = new PostgresStorage();