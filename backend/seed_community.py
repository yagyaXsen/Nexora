"""
Seed script to populate community features with sample data
Run with: python seed_community.py
"""

from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import (
    Opportunity, UserProfile, SuccessStory, 
    OpportunityQuestion, OpportunityAnswer,
    MentorProfile, ApplicationTip
)

def seed_community_data():
    db = SessionLocal()
    
    try:
        # Get first opportunity and user for testing
        opportunity = db.query(Opportunity).first()
        user = db.query(UserProfile).first()
        
        if not opportunity or not user:
            print(" No opportunities or users found. Run the main app first to seed initial data.")
            return
        
        print(f"📦 Using opportunity: {opportunity.title}")
        print(f"👤 Using user: {user.name}")
        
        # Create additional users for variety
        users = [user]
        
        additional_users = [
            UserProfile(
                name="Dr. Sarah Chen",
                email="sarah.chen@stanford.edu",
                bio="AI researcher specializing in natural language processing and machine learning.",
                academic_status="PhD Candidate",
                university="Stanford University",
                research_interests=["NLP", "Machine Learning", "AI Ethics"],
                base_city="Palo Alto",
                reputation_score=150
            ),
            UserProfile(
                name="Marcus Johnson",
                email="marcus.j@mit.edu",
                bio="Quantum computing researcher with focus on quantum algorithms.",
                academic_status="Postdoc",
                university="MIT",
                research_interests=["Quantum Computing", "Physics", "Mathematics"],
                base_city="Cambridge",
                reputation_score=220
            ),
            UserProfile(
                name="Priya Sharma",
                email="priya@oxforduni.uk",
                bio="Climate tech entrepreneur building carbon capture solutions.",
                academic_status="Graduate",
                university="University of Oxford",
                research_interests=["Climate Tech", "Sustainability", "Engineering"],
                base_city="London",
                reputation_score=180
            )
        ]
        
        for new_user in additional_users:
            existing = db.query(UserProfile).filter(UserProfile.email == new_user.email).first()
            if not existing:
                db.add(new_user)
                users.append(new_user)
        
        db.commit()
        print(f"✅ Created {len(additional_users)} additional users")
        
        # Create Success Stories
        stories = [
            SuccessStory(
                opportunity_id=opportunity.id,
                user_id=users[1].id if len(users) > 1 else user.id,
                title="How I Won the Google AI Fellowship on My First Try",
                story_content="I applied to the Google AI Fellowship in my second year of PhD. The key was demonstrating real-world impact of my research. I had published 2 papers at NeurIPS and contributed to TensorFlow. My advice: start early, get strong recommendation letters, and show your code publicly on GitHub. The interview process was intense but fair - they really care about your research vision and technical depth.",
                year_awarded=2025,
                application_timeline={
                    "application_submitted": "2024-08-15",
                    "first_interview": "2024-10-20",
                    "technical_interview": "2024-11-05",
                    "final_decision": "2024-12-10"
                },
                tips=[
                    "Start your application at least 2 months before the deadline",
                    "Get recommendation letters from professors who know your research deeply",
                    "Prepare a clear research proposal with measurable impact",
                    "Practice technical interviews on algorithms and ML fundamentals",
                    "Show open-source contributions and published papers"
                ],
                upvotes=45,
                views=320,
                is_verified="Yes",
                is_featured="Yes"
            ),
            SuccessStory(
                opportunity_id=opportunity.id,
                user_id=users[2].id if len(users) > 2 else user.id,
                title="From Rejection to Acceptance: My Second Application Journey",
                story_content="I was rejected the first time I applied. But I used that feedback to strengthen my application. I published one more paper, improved my research proposal based on reviewer comments, and got better recommendation letters. The second time, I was accepted! Don't give up after one rejection.",
                year_awarded=2026,
                application_timeline={
                    "first_attempt": "2023-07",
                    "rejection": "2023-12",
                    "second_attempt": "2024-08",
                    "acceptance": "2025-01"
                },
                tips=[
                    "Learn from rejection feedback",
                    "Strengthen weak areas systematically",
                    "Get mentor review before reapplying"
                ],
                upvotes=32,
                views=215,
                is_verified="Yes"
            ),
            SuccessStory(
                opportunity_id=opportunity.id,
                user_id=users[3].id if len(users) > 3 else user.id,
                title="Winning as an International Student from India",
                story_content="As an international applicant from India, I was worried about my chances. But I focused on the uniqueness of my research in applying AI to climate solutions. I think what helped was showing how my work could have global impact, especially in developing countries. The fellowship committee values diverse perspectives.",
                year_awarded=2025,
                tips=[
                    "Highlight unique perspective and background",
                    "Show how your research addresses global challenges",
                    "Connect with alumni from your country"
                ],
                upvotes=28,
                views=180,
                is_verified="No"
            )
        ]
        
        for story in stories:
            db.add(story)
        db.commit()
        print(f"✅ Created {len(stories)} success stories")
        
        # Create Questions
        questions = [
            OpportunityQuestion(
                opportunity_id=opportunity.id,
                user_id=users[0].id,
                question_text="How important are publication records for this fellowship? I only have 1 paper published.",
                tags=["requirements", "publications", "eligibility"],
                upvotes=12,
                views=89,
                is_answered="Yes"
            ),
            OpportunityQuestion(
                opportunity_id=opportunity.id,
                user_id=users[1].id if len(users) > 1 else user.id,
                question_text="Can I apply if I'm in my first year of PhD, or should I wait until second year?",
                tags=["eligibility", "timeline", "phd"],
                upvotes=8,
                views=56,
                is_answered="Yes"
            ),
            OpportunityQuestion(
                opportunity_id=opportunity.id,
                user_id=users[2].id if len(users) > 2 else user.id,
                question_text="What's the typical timeline from application to final decision?",
                tags=["timeline", "process"],
                upvotes=15,
                views=102,
                is_answered="No"
            ),
            OpportunityQuestion(
                opportunity_id=opportunity.id,
                user_id=users[3].id if len(users) > 3 else user.id,
                question_text="Do they prefer candidates from top-tier universities or is research quality more important?",
                tags=["eligibility", "requirements"],
                upvotes=10,
                views=78,
                is_answered="Yes"
            )
        ]
        
        for question in questions:
            db.add(question)
        db.commit()
        print(f"✅ Created {len(questions)} questions")
        
        # Create Answers
        answers = [
            OpportunityAnswer(
                question_id=questions[0].id,
                user_id=users[2].id if len(users) > 2 else user.id,
                answer_text="Publications are important but not the only factor. I got accepted with just 1 paper, but I had strong open-source contributions and a compelling research proposal. Quality over quantity!",
                upvotes=8,
                is_accepted="Yes",
                is_verified_expert="No"
            ),
            OpportunityAnswer(
                question_id=questions[1].id,
                user_id=users[1].id if len(users) > 1 else user.id,
                answer_text="You can apply in your first year, but most successful candidates apply in their 2nd or 3rd year when they have more research output. I'd recommend waiting unless you have exceptional work already.",
                upvotes=6,
                is_accepted="Yes",
                is_verified_expert="Yes"
            ),
            OpportunityAnswer(
                question_id=questions[3].id,
                user_id=users[3].id if len(users) > 3 else user.id,
                answer_text="Research quality is definitely more important. I'm from a mid-tier university and still got accepted because my research was strong and had clear impact. They care about your ideas and execution, not just your university name.",
                upvotes=11,
                is_accepted="Yes",
                is_verified_expert="No"
            )
        ]
        
        for answer in answers:
            db.add(answer)
        db.commit()
        print(f"✅ Created {len(answers)} answers")
        
        # Create Mentor Profiles
        mentors = [
            MentorProfile(
                user_id=users[1].id if len(users) > 1 else user.id,
                bio="AI researcher with 3 major fellowships won. Happy to help with application strategy, technical interviews, and research proposals.",
                expertise_areas=["AI/ML", "NLP", "Research Proposals", "Technical Interviews"],
                successful_applications=[str(opportunity.id)],
                availability="Available",
                rating=48,  # 4.8 stars
                total_sessions=12
            ),
            MentorProfile(
                user_id=users[2].id if len(users) > 2 else user.id,
                bio="Quantum computing expert. Won multiple prestigious fellowships. Can help with advanced physics and mathematics applications.",
                expertise_areas=["Quantum Computing", "Physics", "Mathematics", "Fellowship Essays"],
                successful_applications=[str(opportunity.id)],
                availability="Limited",
                rating=50,  # 5.0 stars
                total_sessions=8
            )
        ]
        
        for mentor in mentors:
            db.add(mentor)
        db.commit()
        print(f"✅ Created {len(mentors)} mentor profiles")
        
        # Create Application Tips
        tips = [
            ApplicationTip(
                opportunity_id=opportunity.id,
                category_type="OpportunitySpecific",
                tip_text="Start your application 3 months early. The recommendation letter process alone can take 4-6 weeks.",
                author_id=users[1].id if len(users) > 1 else user.id,
                upvotes=23,
                is_featured="Yes"
            ),
            ApplicationTip(
                opportunity_id=None,
                category_type="General",
                tip_category="Fellowship",
                tip_text="Always tailor your research proposal to align with the fellowship's mission and values. Generic proposals rarely succeed.",
                author_id=users[2].id if len(users) > 2 else user.id,
                upvotes=34,
                is_featured="Yes"
            ),
            ApplicationTip(
                opportunity_id=opportunity.id,
                category_type="OpportunitySpecific",
                tip_text="The technical interview focuses heavily on ML fundamentals and your research methodology. Be ready to explain your work in detail.",
                author_id=users[3].id if len(users) > 3 else user.id,
                upvotes=18,
                is_featured="No"
            ),
            ApplicationTip(
                opportunity_id=None,
                category_type="General",
                tip_category="Fellowship",
                tip_text="Get your application reviewed by past winners if possible. Their insights are invaluable.",
                author_id=users[1].id if len(users) > 1 else user.id,
                upvotes=29,
                is_featured="Yes"
            ),
            ApplicationTip(
                opportunity_id=opportunity.id,
                category_type="OpportunitySpecific",
                tip_text="Show real-world impact of your research, not just theoretical contributions. They want to see how your work helps people.",
                author_id=users[2].id if len(users) > 2 else user.id,
                upvotes=15,
                is_featured="No"
            )
        ]
        
        for tip in tips:
            db.add(tip)
        db.commit()
        print(f"✅ Created {len(tips)} application tips")
        
        print("\n✨ Community data seeding complete!")
        print("\n📊 Summary:")
        print(f"   - {len(stories)} Success Stories")
        print(f"   - {len(questions)} Questions")
        print(f"   - {len(answers)} Answers")
        print(f"   - {len(mentors)} Mentors")
        print(f"   - {len(tips)} Application Tips")
        print(f"\n🚀 Test the API at: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ Error seeding community data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_community_data()
