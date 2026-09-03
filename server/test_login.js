import bcrypt from 'bcryptjs';

const hashAdmin = '$2a$10$bNHaT424ZfLii74LKLfD6.rHkDCtR/.2bsSJKVf2kFxQ7OL8DMUFu';
const hashKwame = '$2a$10$wpFU60Ery7UsknBo1x1D7OfwaVBTjY59sJEw.fdIJGE2e87nnVot6';

async function test() {
  const isAdminMatch = await bcrypt.compare('Admin1234', hashAdmin);
  const isKwameMatch = await bcrypt.compare('Password123!', hashKwame);
  
  console.log('Admin1234 match:', isAdminMatch);
  console.log('Password123! match:', isKwameMatch);
}

test();
