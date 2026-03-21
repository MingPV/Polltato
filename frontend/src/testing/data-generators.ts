import {
  randCompanyName,
  randUserName,
  randEmail,
  randParagraph,
  randUuid,
} from '@ngneat/falso';

const generateUser = () => {
  const firstName = randUserName({ withAccents: false });
  const lastName = randUserName({ withAccents: false });
  return {
    id: randUuid() + Math.random(),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: randEmail(),
    password: 'Password123!',
    teamId: randUuid(),
    teamName: randCompanyName(),
    role: 'ADMIN',
    bio: randParagraph(),
    createdAt: Date.now(),
  };
};

export const createUser = <T extends Partial<ReturnType<typeof generateUser>>>(
  overrides?: T,
) => {
  return { ...generateUser(), ...overrides };
};

const generateTeam = () => ({
  id: randUuid(),
  name: randCompanyName(),
  description: randParagraph(),
  createdAt: Date.now(),
});

export const createTeam = <T extends Partial<ReturnType<typeof generateTeam>>>(
  overrides?: T,
) => {
  return { ...generateTeam(), ...overrides };
};
