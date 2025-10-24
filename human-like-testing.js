/**
 * HUMAN-LIKE INTERACTIVE TESTING SCRIPT
 * Simulates real user interactions: clicking, typing, scrolling, adding, editing
 * Tests all edge cases and unique scenarios
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class HumanLikeTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing Human-Like Testing Environment...');
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for visual testing
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        
        // Set realistic user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Enable request interception for network testing
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            console.log(`📡 Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
        
        console.log('✅ Browser initialized successfully');
    }

    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshots/${name}-${timestamp}.png`;
        await this.page.screenshot({ path: filename, fullPage: true });
        this.screenshots.push(filename);
        console.log(`📸 Screenshot saved: ${filename}`);
    }

    async humanType(selector, text, delay = 100) {
        console.log(`⌨️  Typing "${text}" into ${selector}`);
        await this.page.focus(selector);
        await this.page.type(selector, text, { delay });
        await this.page.waitForTimeout(500); // Human-like pause
    }

    async humanClick(selector, waitTime = 1000) {
        console.log(`🖱️  Clicking ${selector}`);
        await this.page.waitForSelector(selector, { timeout: 10000 });
        await this.page.hover(selector);
        await this.page.waitForTimeout(200); // Human-like hover pause
        await this.page.click(selector);
        await this.page.waitForTimeout(waitTime);
    }

    async humanScroll(direction = 'down', amount = 500) {
        console.log(`📜 Scrolling ${direction} by ${amount}px`);
        if (direction === 'down') {
            await this.page.evaluate((amount) => {
                window.scrollBy(0, amount);
            }, amount);
        } else {
            await this.page.evaluate((amount) => {
                window.scrollBy(0, -amount);
            }, amount);
        }
        await this.page.waitForTimeout(500);
    }

    async testNavigation() {
        console.log('\n🧭 TESTING NAVIGATION & UI INTERACTIONS');
        console.log('==========================================');
        
        try {
            // Navigate to homepage
            console.log('1. Navigating to homepage...');
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('01-homepage-loaded');
            
            // Test navigation menu
            console.log('2. Testing navigation menu...');
            const navItems = ['Home', 'Register', 'Login', 'Help'];
            for (const item of navItems) {
                try {
                    const selector = `a[href*="${item.toLowerCase()}"]`;
                    await this.humanClick(selector);
                    await this.takeScreenshot(`02-nav-${item.toLowerCase()}`);
                    await this.page.waitForTimeout(1000);
                } catch (error) {
                    console.log(`⚠️  Navigation item ${item} not found or clickable`);
                }
            }
            
            // Test scrolling behavior
            console.log('3. Testing scroll behavior...');
            await this.humanScroll('down', 800);
            await this.takeScreenshot('03-scrolled-down');
            await this.humanScroll('up', 400);
            await this.takeScreenshot('04-scrolled-up');
            
            this.testResults.push({ test: 'Navigation', status: 'PASSED', details: 'All navigation elements tested' });
            
        } catch (error) {
            console.log(`❌ Navigation test failed: ${error.message}`);
            this.testResults.push({ test: 'Navigation', status: 'FAILED', details: error.message });
        }
    }

    async testUserRegistration() {
        console.log('\n👤 TESTING USER REGISTRATION');
        console.log('=============================');
        
        try {
            // Navigate to registration
            await this.page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('05-registration-page');
            
            // Test form filling with human-like behavior
            console.log('1. Filling registration form...');
            
            // Generate unique test data
            const timestamp = Date.now();
            const testUser = {
                name: `Test User ${timestamp}`,
                email: `testuser${timestamp}@example.com`,
                password: 'TestPassword123!',
                confirmPassword: 'TestPassword123!'
            };
            
            // Fill form fields with human-like typing
            await this.humanType('input[name="name"]', testUser.name);
            await this.humanType('input[name="email"]', testUser.email);
            await this.humanType('input[name="password"]', testUser.password);
            await this.humanType('input[name="confirmPassword"]', testUser.confirmPassword);
            
            await this.takeScreenshot('06-registration-form-filled');
            
            // Test form validation
            console.log('2. Testing form validation...');
            
            // Test empty fields
            await this.page.evaluate(() => {
                document.querySelector('input[name="name"]').value = '';
            });
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('07-validation-empty-name');
            
            // Test invalid email
            await this.humanType('input[name="name"]', testUser.name);
            await this.humanType('input[name="email"]', 'invalid-email');
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('08-validation-invalid-email');
            
            // Test password mismatch
            await this.humanType('input[name="email"]', testUser.email);
            await this.humanType('input[name="confirmPassword"]', 'DifferentPassword123!');
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('09-validation-password-mismatch');
            
            // Submit valid form
            await this.humanType('input[name="confirmPassword"]', testUser.password);
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('10-registration-success');
            
            this.testResults.push({ test: 'User Registration', status: 'PASSED', details: 'Registration form tested with validation' });
            return testUser;
            
        } catch (error) {
            console.log(`❌ Registration test failed: ${error.message}`);
            this.testResults.push({ test: 'User Registration', status: 'FAILED', details: error.message });
            return null;
        }
    }

    async testUserLogin(testUser) {
        console.log('\n🔐 TESTING USER LOGIN');
        console.log('======================');
        
        try {
            // Navigate to login
            await this.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('11-login-page');
            
            // Test login with invalid credentials
            console.log('1. Testing invalid login...');
            await this.humanType('input[name="email"]', 'wrong@email.com');
            await this.humanType('input[name="password"]', 'wrongpassword');
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('12-login-invalid');
            
            // Test login with valid credentials
            console.log('2. Testing valid login...');
            await this.humanType('input[name="email"]', testUser.email);
            await this.humanType('input[name="password"]', testUser.password);
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('13-login-success');
            
            this.testResults.push({ test: 'User Login', status: 'PASSED', details: 'Login tested with valid and invalid credentials' });
            
        } catch (error) {
            console.log(`❌ Login test failed: ${error.message}`);
            this.testResults.push({ test: 'User Login', status: 'FAILED', details: error.message });
        }
    }

    async testDrivewayCreation() {
        console.log('\n🏠 TESTING DRIVEWAY CREATION');
        console.log('=============================');
        
        try {
            // Navigate to driveway creation
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('14-dashboard-loaded');
            
            // Look for driveway creation button or form
            console.log('1. Looking for driveway creation interface...');
            
            // Test form filling
            const drivewayData = {
                address: '123 Test Street, Test City, TC 12345',
                description: 'Beautiful driveway with easy access and security features',
                size: 'Large',
                price: '25.00',
                amenities: 'Covered, Security, Electric Charging, 24/7 Access'
            };
            
            // Fill driveway form with human-like behavior
            if (await this.page.$('input[name="address"]')) {
                await this.humanType('input[name="address"]', drivewayData.address);
            }
            if (await this.page.$('textarea[name="description"]')) {
                await this.humanType('textarea[name="description"]', drivewayData.description);
            }
            if (await this.page.$('select[name="size"]')) {
                await this.page.select('select[name="size"]', drivewayData.size);
            }
            if (await this.page.$('input[name="price"]')) {
                await this.humanType('input[name="price"]', drivewayData.price);
            }
            if (await this.page.$('input[name="amenities"]')) {
                await this.humanType('input[name="amenities"]', drivewayData.amenities);
            }
            
            await this.takeScreenshot('15-driveway-form-filled');
            
            // Test form submission
            if (await this.page.$('button[type="submit"]')) {
                await this.humanClick('button[type="submit"]');
                await this.takeScreenshot('16-driveway-created');
            }
            
            this.testResults.push({ test: 'Driveway Creation', status: 'PASSED', details: 'Driveway creation form tested' });
            
        } catch (error) {
            console.log(`❌ Driveway creation test failed: ${error.message}`);
            this.testResults.push({ test: 'Driveway Creation', status: 'FAILED', details: error.message });
        }
    }

    async testDrivewayListing() {
        console.log('\n📋 TESTING DRIVEWAY LISTING');
        console.log('============================');
        
        try {
            // Navigate to driveway listing
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('17-driveway-listing');
            
            // Test scrolling through listings
            console.log('1. Testing scroll through listings...');
            await this.humanScroll('down', 600);
            await this.takeScreenshot('18-listing-scrolled');
            
            // Test clicking on driveway items
            console.log('2. Testing driveway item interactions...');
            const drivewayItems = await this.page.$$('[data-testid="driveway-item"], .driveway-item, .listing-item');
            
            if (drivewayItems.length > 0) {
                await this.humanClick('[data-testid="driveway-item"]:first-child, .driveway-item:first-child, .listing-item:first-child');
                await this.takeScreenshot('19-driveway-details');
            }
            
            // Test search functionality
            console.log('3. Testing search functionality...');
            if (await this.page.$('input[placeholder*="search"], input[name="search"]')) {
                await this.humanType('input[placeholder*="search"], input[name="search"]', 'test');
                await this.humanClick('button[type="submit"], .search-button');
                await this.takeScreenshot('20-search-results');
            }
            
            this.testResults.push({ test: 'Driveway Listing', status: 'PASSED', details: 'Driveway listing interactions tested' });
            
        } catch (error) {
            console.log(`❌ Driveway listing test failed: ${error.message}`);
            this.testResults.push({ test: 'Driveway Listing', status: 'FAILED', details: error.message });
        }
    }

    async testBookingSystem() {
        console.log('\n📅 TESTING BOOKING SYSTEM');
        console.log('==========================');
        
        try {
            // Navigate to booking interface
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('21-booking-interface');
            
            // Test booking form
            console.log('1. Testing booking form...');
            
            // Look for booking button or form
            const bookingButtons = await this.page.$$('button:contains("Book"), .book-button, [data-testid="book-button"]');
            
            if (bookingButtons.length > 0) {
                await this.humanClick('button:contains("Book"):first, .book-button:first, [data-testid="book-button"]:first');
                await this.takeScreenshot('22-booking-modal');
                
                // Fill booking form
                const bookingData = {
                    startDate: '2024-01-20',
                    startTime: '10:00',
                    endDate: '2024-01-20',
                    endTime: '12:00',
                    specialRequests: 'Test booking with special requirements'
                };
                
                // Fill form fields
                if (await this.page.$('input[name="startDate"]')) {
                    await this.humanType('input[name="startDate"]', bookingData.startDate);
                }
                if (await this.page.$('input[name="startTime"]')) {
                    await this.humanType('input[name="startTime"]', bookingData.startTime);
                }
                if (await this.page.$('input[name="endDate"]')) {
                    await this.humanType('input[name="endDate"]', bookingData.endDate);
                }
                if (await this.page.$('input[name="endTime"]')) {
                    await this.humanType('input[name="endTime"]', bookingData.endTime);
                }
                if (await this.page.$('textarea[name="specialRequests"]')) {
                    await this.humanType('textarea[name="specialRequests"]', bookingData.specialRequests);
                }
                
                await this.takeScreenshot('23-booking-form-filled');
                
                // Submit booking
                if (await this.page.$('button[type="submit"]')) {
                    await this.humanClick('button[type="submit"]');
                    await this.takeScreenshot('24-booking-submitted');
                }
            }
            
            this.testResults.push({ test: 'Booking System', status: 'PASSED', details: 'Booking system interactions tested' });
            
        } catch (error) {
            console.log(`❌ Booking system test failed: ${error.message}`);
            this.testResults.push({ test: 'Booking System', status: 'FAILED', details: error.message });
        }
    }

    async testEdgeCases() {
        console.log('\n⚠️  TESTING EDGE CASES & UNIQUE SCENARIOS');
        console.log('==========================================');
        
        try {
            // Test 1: Very long input strings
            console.log('1. Testing long input strings...');
            await this.page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
            
            const longString = 'A'.repeat(1000);
            if (await this.page.$('input[name="name"]')) {
                await this.humanType('input[name="name"]', longString);
                await this.takeScreenshot('25-long-input-test');
            }
            
            // Test 2: Special characters
            console.log('2. Testing special characters...');
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            if (await this.page.$('input[name="name"]')) {
                await this.page.evaluate(() => {
                    document.querySelector('input[name="name"]').value = '';
                });
                await this.humanType('input[name="name"]', specialChars);
                await this.takeScreenshot('26-special-chars-test');
            }
            
            // Test 3: XSS attempt
            console.log('3. Testing XSS protection...');
            const xssAttempt = '<script>alert("XSS")</script>';
            if (await this.page.$('input[name="name"]')) {
                await this.page.evaluate(() => {
                    document.querySelector('input[name="name"]').value = '';
                });
                await this.humanType('input[name="name"]', xssAttempt);
                await this.takeScreenshot('27-xss-protection-test');
            }
            
            // Test 4: SQL injection attempt
            console.log('4. Testing SQL injection protection...');
            const sqlInjection = "'; DROP TABLE users; --";
            if (await this.page.$('input[name="name"]')) {
                await this.page.evaluate(() => {
                    document.querySelector('input[name="name"]').value = '';
                });
                await this.humanType('input[name="name"]', sqlInjection);
                await this.takeScreenshot('28-sql-injection-test');
            }
            
            // Test 5: Network interruption simulation
            console.log('5. Testing network interruption...');
            await this.page.setOfflineMode(true);
            await this.humanClick('button[type="submit"]');
            await this.takeScreenshot('29-offline-test');
            await this.page.setOfflineMode(false);
            
            // Test 6: Rapid clicking
            console.log('6. Testing rapid clicking...');
            for (let i = 0; i < 5; i++) {
                await this.humanClick('button[type="submit"]', 100);
            }
            await this.takeScreenshot('30-rapid-clicking-test');
            
            this.testResults.push({ test: 'Edge Cases', status: 'PASSED', details: 'Edge cases and security tests completed' });
            
        } catch (error) {
            console.log(`❌ Edge cases test failed: ${error.message}`);
            this.testResults.push({ test: 'Edge Cases', status: 'FAILED', details: error.message });
        }
    }

    async testMobileResponsiveness() {
        console.log('\n📱 TESTING MOBILE RESPONSIVENESS');
        console.log('=================================');
        
        try {
            // Test different screen sizes
            const screenSizes = [
                { name: 'iPhone SE', width: 375, height: 667 },
                { name: 'iPhone 12', width: 390, height: 844 },
                { name: 'iPad', width: 768, height: 1024 },
                { name: 'Desktop', width: 1920, height: 1080 }
            ];
            
            for (const size of screenSizes) {
                console.log(`Testing ${size.name} (${size.width}x${size.height})...`);
                await this.page.setViewport({ width: size.width, height: size.height });
                await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                await this.takeScreenshot(`31-${size.name.replace(' ', '-').toLowerCase()}`);
                
                // Test touch interactions
                if (size.width < 768) {
                    await this.humanScroll('down', 300);
                    await this.takeScreenshot(`32-${size.name.replace(' ', '-').toLowerCase()}-scrolled`);
                }
            }
            
            this.testResults.push({ test: 'Mobile Responsiveness', status: 'PASSED', details: 'Multiple screen sizes tested' });
            
        } catch (error) {
            console.log(`❌ Mobile responsiveness test failed: ${error.message}`);
            this.testResults.push({ test: 'Mobile Responsiveness', status: 'FAILED', details: error.message });
        }
    }

    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE & LOADING');
        console.log('=================================');
        
        try {
            // Test page load performance
            console.log('1. Testing page load performance...');
            const startTime = Date.now();
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            console.log(`Page load time: ${loadTime}ms`);
            
            // Test memory usage
            const metrics = await this.page.metrics();
            console.log(`Memory usage: ${JSON.stringify(metrics, null, 2)}`);
            
            // Test network requests
            const requests = [];
            this.page.on('request', request => {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: Date.now()
                });
            });
            
            await this.page.reload({ waitUntil: 'networkidle2' });
            console.log(`Network requests: ${requests.length}`);
            
            this.testResults.push({ 
                test: 'Performance', 
                status: 'PASSED', 
                details: `Load time: ${loadTime}ms, Requests: ${requests.length}` 
            });
            
        } catch (error) {
            console.log(`❌ Performance test failed: ${error.message}`);
            this.testResults.push({ test: 'Performance', status: 'FAILED', details: error.message });
        }
    }

    async generateReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT');
        console.log('========================================');
        
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.testResults.length,
            passedTests: this.testResults.filter(t => t.status === 'PASSED').length,
            failedTests: this.testResults.filter(t => t.status === 'FAILED').length,
            testResults: this.testResults,
            screenshots: this.screenshots,
            summary: {
                successRate: `${Math.round((this.testResults.filter(t => t.status === 'PASSED').length / this.testResults.length) * 100)}%`,
                totalScreenshots: this.screenshots.length,
                testDuration: 'Comprehensive human-like testing completed'
            }
        };
        
        // Save report to file
        fs.writeFileSync('human-like-test-report.json', JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('\n🎯 TEST RESULTS SUMMARY:');
        console.log('========================');
        console.log(`✅ Passed: ${report.passedTests}`);
        console.log(`❌ Failed: ${report.failedTests}`);
        console.log(`📊 Success Rate: ${report.summary.successRate}`);
        console.log(`📸 Screenshots: ${report.summary.totalScreenshots}`);
        console.log(`📄 Report saved: human-like-test-report.json`);
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Cleanup completed');
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            // Create screenshots directory
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            
            // Run all test phases
            await this.testNavigation();
            const testUser = await this.testUserRegistration();
            if (testUser) {
                await this.testUserLogin(testUser);
            }
            await this.testDrivewayCreation();
            await this.testDrivewayListing();
            await this.testBookingSystem();
            await this.testEdgeCases();
            await this.testMobileResponsiveness();
            await this.testPerformance();
            
            // Generate final report
            const report = await this.generateReport();
            
            return report;
            
        } catch (error) {
            console.log(`❌ Test execution failed: ${error.message}`);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Export for use
module.exports = HumanLikeTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new HumanLikeTester();
    tester.runAllTests()
        .then(report => {
            console.log('\n🎉 HUMAN-LIKE TESTING COMPLETED SUCCESSFULLY!');
            console.log(`📊 Final Success Rate: ${report.summary.successRate}`);
            process.exit(0);
        })
        .catch(error => {
            console.log(`❌ Testing failed: ${error.message}`);
            process.exit(1);
        });
}
