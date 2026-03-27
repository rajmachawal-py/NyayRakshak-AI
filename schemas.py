from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        orm_mode = True


class ContractBase(BaseModel):
    contract_text: str
    analysis_result: str
    user_id: Optional[int] = None


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
