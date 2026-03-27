from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import Base, engine, get_db
from models import Contract, User
from schemas import ContractCreate, ContractRead, UserCreate, UserLogin, UserRead

app = FastAPI(title="NyayRakshak FastAPI Postgres")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/signup", response_model=UserRead)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_data.email,
        password=get_password_hash(user_data.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@app.post("/login", response_model=UserRead)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)) -> User:
    user = await get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@app.post("/save-contract", response_model=ContractRead)
async def save_contract(contract_data: ContractCreate, db: AsyncSession = Depends(get_db)) -> Contract:
    if not contract_data.user_id:
        raise HTTPException(status_code=400, detail="Guest mode - contract not saved")

    user = await get_user_by_id(db, contract_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    contract = Contract(
        user_id=contract_data.user_id,
        contract_text=contract_data.contract_text,
        analysis_result=contract_data.analysis_result,
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


@app.get("/my-contracts/{user_id}", response_model=List[ContractRead])
async def get_my_contracts(user_id: int, db: AsyncSession = Depends(get_db)) -> List[ContractRead]:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = await db.execute(select(Contract).where(Contract.user_id == user_id).order_by(Contract.created_at.desc()))
    return result.scalars().all()


@app.get("/contracts", response_model=List[ContractRead])
async def list_contracts(db: AsyncSession = Depends(get_db)) -> List[ContractRead]:
    result = await db.execute(select(Contract).order_by(Contract.created_at.desc()))
    return result.scalars().all()


@app.get("/contracts/{contract_id}", response_model=ContractRead)
async def read_contract(contract_id: int, db: AsyncSession = Depends(get_db)) -> ContractRead:
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalars().first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract
