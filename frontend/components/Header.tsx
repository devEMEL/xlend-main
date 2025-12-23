'use client';
import React, { useState } from 'react';
import { Logo } from './Logo';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);


    return (
        <nav className="bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Logo />

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4 bg-white">
                        <Link
                            href="/get-cweth"
                            className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer ml-2"
                        >
                            Get CWETH
                        </Link>
                        <Link
                            href="/form"
                            className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer ml-2"
                        >
                            Create Fund
                        </Link>

                        <ConnectButton showBalance={true} />

    
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="text-white p-2"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMobileOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                        <Link
                            href="/mint-test-nft"
                            //   className="block text-white hover:text-white/80 px-3 py-2"
                            className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                            Mint Test NFT
                        </Link>
                        <Link
                            href="/get-cweth"
                            //   className="block text-white hover:text-white/80 px-3 py-2"
                            className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                            Get CWETH
                        </Link>
                        <Link
                            href="/"
                            //   className="block text-white hover:text-white/80 px-3 py-2"
                            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                           Auctions
                        </Link>
                        <Link
                            href="/profile"
                            //   className="block text-white hover:text-white/80 px-3 py-2"
                            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                            Profile
                        </Link>


        
                        <ConnectButton showBalance={true} />
 
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Header;
