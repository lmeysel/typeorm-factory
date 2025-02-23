import { CollectionSubfactory, EagerInstanceAttribute, Factory, LazyInstanceAttribute, SingleSubfactory } from "../src";
import { Pet } from "./fixtures/Pet.entity";
import { PetFactory } from "./fixtures/Pet.factory";
import { User } from "./fixtures/User.entity";
import { UserFactory } from "./fixtures/User.factory";
import { dataSource } from "./fixtures/dataSource";

describe(Factory, () => {
	describe(Factory.prototype.make, () => {
		describe(UserFactory, () => {
			const factory = new UserFactory();

			test("Should make a new entity", async () => {
				const userMaked = await factory.make();

				expect(userMaked).toBeInstanceOf(User);
				expect(userMaked.id).toBeUndefined();
				expect(userMaked.name).toBeDefined();
				expect(userMaked.lastName).toBeDefined();
				expect(userMaked.age).toBeDefined();
				expect(userMaked.email).toBeDefined();

				expect(userMaked.pets).toBeInstanceOf(Array);
				expect(userMaked.pets).toHaveLength(0);
			});

			test("Should make a new entity with attribute overrided", async () => {
				const userMaked = await factory.make({
					name: "john",
				});

				expect(userMaked.name).toBe("john");
			});

			test("Should make a new entity with function as attribute", async () => {
				const userMaked = await factory.make({
					name: () => "john",
				});

				expect(userMaked.name).toBe("john");
			});

			test("Should make a new entity with async function as attribute", async () => {
				const userMaked = await factory.make({
					name: async () => "john",
				});

				expect(userMaked.name).toBe("john");
			});

			test("Should make a new entity with instance attributes", async () => {
				const userMaked = await factory.make({
					email: new EagerInstanceAttribute((instance) =>
						[instance.name.toLowerCase(), instance.lastName.toLowerCase(), "@email.com"].join(""),
					),
				});

				expect(userMaked.email).toMatch(userMaked.name.toLowerCase());
				expect(userMaked.email).toMatch(userMaked.lastName.toLowerCase());
			});

			test("Should make a new entity with lazy instance attributes", async () => {
				const userMaked = await factory.make({
					email: new EagerInstanceAttribute((instance) =>
						[instance.name.toLowerCase(), instance.lastName.toLowerCase(), "@email.com"].join(""),
					),
				});

				expect(userMaked.email).toMatch(userMaked.name.toLowerCase());
				expect(userMaked.email).toMatch(userMaked.lastName.toLowerCase());
			});

			test("Should make a new entity with multiple subfactories", async () => {
				const userMaked = await factory.make({
					pets: new LazyInstanceAttribute((instance) => new CollectionSubfactory(PetFactory, 1, { owner: instance })),
				});

				expect(userMaked.pets).toBeInstanceOf(Array);
				expect(userMaked.pets).toHaveLength(1);

				for (const pet of userMaked.pets) {
					expect(pet.id).toBeUndefined();
					expect(pet.owner).toBeInstanceOf(User);
					expect(pet.owner.id).toBeUndefined();
				}
			});

			test("Should make a new entity with multiple subfactories in an array", async () => {
				const userMaked = await factory.make({
					pets: new LazyInstanceAttribute((instance) => [new SingleSubfactory(PetFactory, { owner: instance })]),
				});

				expect(userMaked.pets).toBeInstanceOf(Array);
				expect(userMaked.pets).toHaveLength(1);
				for (const user of userMaked.pets) {
					expect(user.id).toBeUndefined();
					expect(user.owner).toBeInstanceOf(User);
					expect(user.owner.id).toBeUndefined();
				}
			});

			test("Should make a new entity with multiple existing subfactories", async () => {
				const petFactory = new PetFactory();

				const userMaked = await factory.make({
					pets: new LazyInstanceAttribute((instance) => new CollectionSubfactory(petFactory, 1, { owner: instance })),
				});

				expect(userMaked.pets).toBeInstanceOf(Array);
				expect(userMaked.pets).toHaveLength(1);

				for (const pet of userMaked.pets) {
					expect(pet.id).toBeUndefined();
					expect(pet.owner).toBeInstanceOf(User);
					expect(pet.owner.id).toBeUndefined();
				}
			});

			test("Should make two entities with different attributes", async () => {
				const userMaked1 = await factory.make();
				const userMaked2 = await factory.make();

				expect(userMaked1).not.toStrictEqual(userMaked2);
			});
		});

		describe(PetFactory, () => {
			const factory = new PetFactory();

			test("Should make a new entity with single subfactory", async () => {
				const petMaked = await factory.make();

				expect(petMaked).toBeInstanceOf(Pet);
				expect(petMaked.id).toBeUndefined();
				expect(petMaked.name).toBeDefined();
				expect(petMaked.owner).toBeDefined();
				expect(petMaked.owner).toBeInstanceOf(User);
				expect(petMaked.owner.id).toBeUndefined();
			});

			test("Should make a new entity with single existing subfactory", async () => {
				const userFactory = new UserFactory();

				const petMaked = await factory.make({
					owner: new LazyInstanceAttribute((instance) => new SingleSubfactory(userFactory, { pets: [instance] })),
				});

				expect(petMaked).toBeInstanceOf(Pet);
				expect(petMaked.id).toBeUndefined();
				expect(petMaked.name).toBeDefined();
				expect(petMaked.owner).toBeDefined();
				expect(petMaked.owner).toBeInstanceOf(User);
				expect(petMaked.owner.id).toBeUndefined();
			});
		});
	});

	describe(Factory.prototype.makeMany, () => {
		test("Should make many new entities", async () => {
			const count = 2;
			const factory = new UserFactory();
			const entitiesMaked = await factory.makeMany(count);

			expect(entitiesMaked).toHaveLength(count);

			for (const entity of entitiesMaked) {
				expect(entity.id).toBeUndefined();
			}
		});

		test("Should make entities with array based overrideParams", async () => {
			const count = 4;
			const factory = new UserFactory();
			const entitiesMaked = await factory.makeMany(count, [
				{ email: "foo@no-reply.bar" },
				{ email: "foo@no-reply.bar" },
			]);

			expect(entitiesMaked).toHaveLength(count);

			for (let i = 0; i < count; i++) {
				const entity = entitiesMaked[i] as User;
				expect(entity.id).toBeUndefined();
				expect(entity.email).toEqual(["foo@no-reply.bar", "foo@no-reply.bar"][i % 2]);
			}
		});

		test("Should make entities with function based overrideParams", async () => {
			const count = 4;
			const factory = new UserFactory();
			const entitiesMaked = await factory.makeMany(count, (index) => ({ email: `${index}@no-reply.bar` }));

			expect(entitiesMaked).toHaveLength(count);

			for (let i = 0; i < count; i++) {
				const entity = entitiesMaked[i] as User;
				expect(entity.id).toBeUndefined();
				expect(entity.email).toEqual(`${i}@no-reply.bar`);
			}
		});
	});

	describe(Factory.prototype.create, () => {
		beforeAll(async () => {
			await dataSource.initialize();
		});

		beforeEach(async () => {
			await dataSource.synchronize(true);
		});

		afterAll(async () => {
			await dataSource.destroy();
		});

		describe(UserFactory, () => {
			const factory = new UserFactory();

			test("Should create a new entity", async () => {
				const userCreated = await factory.create();

				expect(userCreated).toBeInstanceOf(User);
				expect(userCreated.id).toBeDefined();
				expect(userCreated.name).toBeDefined();
				expect(userCreated.lastName).toBeDefined();
				expect(userCreated.age).toBeDefined();
				expect(userCreated.email).toBeDefined();

				expect(userCreated.pets).toBeInstanceOf(Array);
				expect(userCreated.pets).toHaveLength(0);
			});

			test("Should create a new entity with attribute overrided", async () => {
				const userCreated = await factory.create({
					name: "john",
				});

				expect(userCreated.name).toBe("john");
			});

			test("Should create a new entity with function as attribute", async () => {
				const userCreated = await factory.create({
					name: () => "john",
				});

				expect(userCreated.name).toBe("john");
			});

			test("Should create a new entity with async function as attribute", async () => {
				const userCreated = await factory.create({
					name: async () => "john",
				});

				expect(userCreated.name).toBe("john");
			});

			test("Should create a new entity with instance attributes", async () => {
				const userCreated = await factory.create({
					email: new EagerInstanceAttribute((instance) =>
						[instance.name.toLowerCase(), instance.lastName.toLowerCase(), "@email.com"].join(""),
					),
				});

				expect(userCreated.email).toMatch(userCreated.name.toLowerCase());
				expect(userCreated.email).toMatch(userCreated.lastName.toLowerCase());
			});

			test("Should create a new entity with lazy instance attributes", async () => {
				const userCreated = await factory.create({
					email: new EagerInstanceAttribute((instance) =>
						[instance.name.toLowerCase(), instance.lastName.toLowerCase(), "@email.com"].join(""),
					),
				});

				expect(userCreated.email).toMatch(userCreated.name.toLowerCase());
				expect(userCreated.email).toMatch(userCreated.lastName.toLowerCase());
			});

			test("Should create a new entity with multiple subfactories", async () => {
				const userCreated = await factory.create({
					pets: new LazyInstanceAttribute((instance) => new CollectionSubfactory(PetFactory, 1, { owner: instance })),
				});

				expect(userCreated.pets).toBeInstanceOf(Array);
				expect(userCreated.pets).toHaveLength(1);

				for (const pet of userCreated.pets) {
					expect(pet.id).toBeDefined();
					expect(pet.owner).toBeInstanceOf(User);
					expect(pet.owner.id).toBeDefined();
					expect(pet.owner.id).toBe(userCreated.id);
				}
			});

			test("Should make a new entity with multiple subfactories in an array", async () => {
				const userCreated = await factory.create({
					pets: new LazyInstanceAttribute((instance) => [new SingleSubfactory(PetFactory, { owner: instance })]),
				});

				expect(userCreated.pets).toBeInstanceOf(Array);
				expect(userCreated.pets).toHaveLength(1);

				for (const pet of userCreated.pets) {
					expect(pet.id).toBeDefined();
					expect(pet.owner).toBeInstanceOf(User);
					expect(pet.owner.id).toBeDefined();
					expect(pet.owner.id).toBe(userCreated.id);
				}
			});

			test("Should create two entities with different attributes", async () => {
				const userCreated1 = await factory.create();
				const userCreated2 = await factory.create();

				expect(userCreated1).not.toStrictEqual(userCreated2);
			});
		});

		describe(PetFactory, () => {
			const factory = new PetFactory();

			test("Should create a new entity with single subfactory", async () => {
				const petCreated = await factory.create();

				expect(petCreated).toBeInstanceOf(Pet);
				expect(petCreated.id).toBeDefined();
				expect(petCreated.name).toBeDefined();
				expect(petCreated.owner).toBeDefined();
				expect(petCreated.owner).toBeInstanceOf(User);
				expect(petCreated.owner.id).toBeDefined();
			});
		});
	});

	describe(Factory.prototype.createMany, () => {
		beforeAll(async () => {
			await dataSource.initialize();
		});

		beforeEach(async () => {
			await dataSource.synchronize(true);
		});

		afterAll(async () => {
			await dataSource.destroy();
		});

		test("Should create many new entities", async () => {
			const count = 2;
			const factory = new UserFactory();
			const entitiesCreated = await factory.createMany(count);

			expect(entitiesCreated).toHaveLength(count);
			for (const entity of entitiesCreated) {
				expect(entity.id).toBeDefined();
			}
		});

		test("Should create entities with array based overrideParams", async () => {
			const count = 4;
			const factory = new UserFactory();
			const entitiesCreated = await factory.createMany(count, [
				{ email: "foo@no-reply.bar" },
				{ email: "foo@no-reply.bar" },
			]);

			expect(entitiesCreated).toHaveLength(count);

			for (let i = 0; i < count; i++) {
				const entity = entitiesCreated[i] as User;
				expect(entity.id).toBeDefined();
				expect(entity.email).toEqual(["foo@no-reply.bar", "foo@no-reply.bar"][i % 2]);
			}
		});

		test("Should create entities with function based overrideParams", async () => {
			const count = 4;
			const factory = new UserFactory();
			const entitiesCreated = await factory.createMany(count, (index) => ({ email: `${index}@no-reply.bar` }));

			expect(entitiesCreated).toHaveLength(count);

			for (let i = 0; i < count; i++) {
				const entity = entitiesCreated[i] as User;
				expect(entity.id).toBeDefined();
				expect(entity.email).toEqual(`${i}@no-reply.bar`);
			}
		});
	});
});
