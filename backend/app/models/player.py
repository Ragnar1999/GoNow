"""Pydantic models for player data."""
from pydantic import BaseModel
from typing import Optional


class PlayerSummary(BaseModel):
    pin: int
    firstName: str
    lastName: str
    countryCode: str
    grade: str
    rating: Optional[int] = None
    club: Optional[str] = None
    totalTournaments: Optional[int] = None
    lastAppearance: Optional[str] = None


class TournamentInfo(BaseModel):
    code: str
    description: Optional[str] = None
    date: Optional[str] = None
    city: Optional[str] = None
    nation: Optional[str] = None


class PlacementInfo(BaseModel):
    id: int
    tournamentCode: str
    placement: int
    gradeDeclared: str
    wonGames: int
    lostGames: int
    jigoGames: int
    precedentRating: Optional[float] = None
    followingRating: Optional[float] = None
    tournament: Optional[TournamentInfo] = None


class PlayerDetail(BaseModel):
    pin: int
    firstName: str
    lastName: str
    countryCode: str
    club: Optional[str] = None
    grade: str
    rating: Optional[int] = None
    deltaRating: Optional[int] = None
    proposedGrade: Optional[str] = None
    totalTournaments: Optional[int] = None
    lastAppearance: Optional[str] = None
    egfPlacement: Optional[int] = None
    placements: Optional[list[PlacementInfo]] = None


class SearchResponse(BaseModel):
    data: list[PlayerSummary]
    total: int
    currentPage: int
    hasMorePages: bool
