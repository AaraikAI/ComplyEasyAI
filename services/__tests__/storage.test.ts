
import { db } from '../storage';
import { MOCK_USERS } from '../../constants';




describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize logic would normally happen on import, 
    // but we can manually trigger or mock localstorage items
    localStorage.setItem('db_users', JSON.stringify(MOCK_USERS));
    localStorage.setItem('db_risks', '[]');
  });

  it('db.users.getAll returns users', () => {
    const users = db.users.getAll();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].email).toBe('sarah@complyeasy.ai');
  });

  it('db.risks.update adds new risk', () => {
    const newRisk: any = { id: 'r99', description: 'Test Risk' };
    db.risks.update(newRisk);
    const risks = db.risks.getAll();
    expect(risks).toContainEqual(newRisk);
  });

  it('db.users.create adds user', () => {
    const newUser: any = { id: 'u99', name: 'Test', email: 'test@test.com' };
    db.users.create(newUser);
    const found = db.users.find('test@test.com');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test');
  });
});