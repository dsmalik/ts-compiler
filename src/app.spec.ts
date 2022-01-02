import { getName, sayHello, age } from './libs';

it('app should pass', () => {
	const _ = getName();
	expect(1).toBeTruthy();
});
