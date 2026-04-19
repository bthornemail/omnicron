-- Polyform Unified Library
-- Core types and functions for polyform/polynomial system

module Polyform.Unified where

import Data.Bits
import Data.Word
import Numeric (showHex)

-- ============================================================
-- CORE TYPES
-- ============================================================

data Matrix5x5 = Matrix5x5 [[Bool]]
    deriving (Eq)

data BasisKind 
    = Squares | Cubes | Triangles | Hexagons 
    | RightTriangles | Rhombs | MultiRhombs | Octagons 
    | Rounds | Bends | Hops | GoldenTriangles
    deriving (Eq, Show)

data RankKind = Polyominoid | Polycube
    deriving (Eq, Show)

data GroupKind 
    = Pseudo | Abolo | Drafter | Hex 
    | Iamond | Knight | Stick
    deriving (Eq, Show)

data PolyformIdentity = PolyformIdentity
    { pBasis  :: BasisKind
    , pDegree :: Int
    , pRank   :: RankKind
    , pGroup :: GroupKind
    } deriving (Eq, Show)

data PolyformCell = PolyformCell
    { cX   :: Int
    , cY   :: Int  
    , cZ   :: Int
    , cRot :: Int
    , cFlip :: Bool
    } deriving (Eq, Show)

data Polyform = Polyform 
    { polyId   :: PolyformIdentity
    , polyCells :: [PolyformCell]
    } deriving (Eq, Show)

data Codepoint40 
    = CP8x5 [Word8]   
    | CP5x8 [Word8]   
    deriving (Eq, Show)

data BEEtagPacket = BEEtagPacket
    { beeSeq :: Int
    , beeCells :: [PolyformCell]
    } deriving (Eq, Show)

-- ============================================================
-- 2-OF-5 ENCODING
-- ============================================================

twoOfFive :: [Word8]
twoOfFive = [0x07, 0x0B, 0x0D, 0x0E, 0x13, 0x15, 0x16, 0x19, 0x1A, 0x1C]

encodeTwoOfFive :: Int -> Word8
encodeTwoOfFive idx = twoOfFive !! (idx `mod` 10)

decodeTwoOfFive :: Word8 -> Maybe Int
decodeTwoOfFive w = lookup w (zip twoOfFive [0..])

-- ============================================================
-- BUILDERS
-- ============================================================

buildSVG :: Polyform -> String
buildSVG p = 
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" ++
    concatMap cellToSVG (polyCells p) ++
    "</svg>"
  where
    cellToSVG c = 
        let x = cX c * 20
            y = cY c * 20
        in "<rect x='" ++ show x ++ "' y='" ++ show y ++ "' width='18' height='18'/>"

build3D :: Polyform -> [(Int,Int,Int)]
build3D p = map (\c -> (cX c, cY c, cZ c)) (polyCells p)

-- ============================================================
-- INSTRUMENTS
-- ============================================================

genailleMultiply :: Int -> Int -> Int
genailleMultiply a b = table !! (a `mod` 10) !! (b `mod` 10)
  where
    table = 
        [ [0,1,2,3,4,5,6,7,8,9]
        , [0,2,4,6,8,0,2,4,6,8]
        , [0,3,6,9,2,5,8,1,4,7]
        , [0,4,8,2,6,0,4,8,2,6]
        , [0,5,0,5,0,5,0,5,0,5]
        , [0,6,2,8,4,0,6,2,8,4]
        , [0,7,4,1,8,5,2,9,6,3]
        , [0,8,6,4,2,0,8,6,4,2]
        , [0,9,8,7,6,5,4,3,2,1]
        , [0,0,0,0,0,0,0,0,0,0]
        ]

-- ============================================================
-- HELPERS
-- ============================================================

matrixToBits :: Matrix5x5 -> [Bool]
matrixToBits (Matrix5x5 m) = concat m

defaultIdentity :: PolyformIdentity
defaultIdentity = PolyformIdentity Squares 1 Polyominoid Pseudo

-- ============================================================
-- TEST
-- ============================================================

test :: IO ()
test = do
    putStrLn "Testing polyform..."
    putStrLn $ "2-of-5(5) = 0x" ++ showHex (encodeTwoOfFive 5) ""
    putStrLn $ "Genaille 7*8 = " ++ show (genailleMultiply 7 8)