from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import (
    SuccessStory, OpportunityQuestion, OpportunityAnswer,
    MentorProfile, MentorshipRequest, ApplicationTip,
    CommunityVote, UserProfile, Opportunity
)
from ..schemas_community import (
    SuccessStoryCreate, SuccessStoryUpdate, SuccessStoryResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse, QuestionWithAnswers,
    AnswerCreate, AnswerUpdate, AnswerResponse,
    MentorProfileCreate, MentorProfileUpdate, MentorProfileResponse,
    MentorshipRequestCreate, MentorshipRequestUpdate, MentorshipRequestResponse,
    ApplicationTipCreate, ApplicationTipUpdate, ApplicationTipResponse,
    VoteCreate, CommunityStats
)

router = APIRouter(prefix="/community", tags=["Community"])


# ============================================================================
# SUCCESS STORIES ENDPOINTS
# ============================================================================

@router.get("/success-stories/", response_model=List[SuccessStoryResponse])
def get_success_stories(
    opportunity_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = Query("recent", regex="^(recent|popular|verified)$"),
    db: Session = Depends(get_db)
):
    """Get success stories with optional filtering"""
    query = db.query(SuccessStory)
    
    if opportunity_id:
        query = query.filter(SuccessStory.opportunity_id == opportunity_id)
    
    # Sorting
    if sort_by == "popular":
        query = query.order_by(desc(SuccessStory.upvotes))
    elif sort_by == "verified":
        query = query.filter(SuccessStory.is_verified == "Yes").order_by(desc(SuccessStory.created_at))
    else:  # recent
        query = query.order_by(desc(SuccessStory.created_at))
    
    stories = query.offset(skip).limit(limit).all()
    
    # Enrich with user and opportunity data
    result = []
    for story in stories:
        story_dict = story.__dict__
        user = db.query(UserProfile).filter(UserProfile.id == story.user_id).first()
        opp = db.query(Opportunity).filter(Opportunity.id == story.opportunity_id).first()
        
        if user:
            story_dict['user_name'] = user.name
            story_dict['user_university'] = user.university
        if opp:
            story_dict['opportunity_title'] = opp.title
            
        result.append(SuccessStoryResponse(**story_dict))
    
    return result


@router.get("/success-stories/{story_id}", response_model=SuccessStoryResponse)
def get_success_story(story_id: UUID, db: Session = Depends(get_db)):
    """Get a single success story by ID"""
    story = db.query(SuccessStory).filter(SuccessStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Success story not found")
    
    # Increment view count
    story.views += 1
    db.commit()
    
    # Enrich with user data
    story_dict = story.__dict__
    user = db.query(UserProfile).filter(UserProfile.id == story.user_id).first()
    opp = db.query(Opportunity).filter(Opportunity.id == story.opportunity_id).first()
    
    if user:
        story_dict['user_name'] = user.name
        story_dict['user_university'] = user.university
    if opp:
        story_dict['opportunity_title'] = opp.title
    
    return SuccessStoryResponse(**story_dict)


@router.post("/success-stories/", response_model=SuccessStoryResponse)
def create_success_story(story: SuccessStoryCreate, db: Session = Depends(get_db)):
    """Create a new success story"""
    # Verify opportunity exists
    opp = db.query(Opportunity).filter(Opportunity.id == story.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    new_story = SuccessStory(**story.dict())
    db.add(new_story)
    
    # Update user reputation
    user = db.query(UserProfile).filter(UserProfile.id == story.user_id).first()
    if user:
        user.reputation_score += 50
    
    db.commit()
    db.refresh(new_story)
    
    return SuccessStoryResponse(**new_story.__dict__)


@router.put("/success-stories/{story_id}", response_model=SuccessStoryResponse)
def update_success_story(
    story_id: UUID,
    story_update: SuccessStoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a success story"""
    story = db.query(SuccessStory).filter(SuccessStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Success story not found")
    
    update_data = story_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(story, key, value)
    
    db.commit()
    db.refresh(story)
    
    return SuccessStoryResponse(**story.__dict__)


@router.delete("/success-stories/{story_id}")
def delete_success_story(story_id: UUID, db: Session = Depends(get_db)):
    """Delete a success story"""
    story = db.query(SuccessStory).filter(SuccessStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Success story not found")
    
    db.delete(story)
    db.commit()
    
    return {"message": "Success story deleted successfully"}


# ============================================================================
# Q&A ENDPOINTS
# ============================================================================

@router.get("/questions/", response_model=List[QuestionResponse])
def get_questions(
    opportunity_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = Query("recent", regex="^(recent|popular|unanswered)$"),
    db: Session = Depends(get_db)
):
    """Get questions with optional filtering"""
    query = db.query(OpportunityQuestion)
    
    if opportunity_id:
        query = query.filter(OpportunityQuestion.opportunity_id == opportunity_id)
    
    # Sorting
    if sort_by == "popular":
        query = query.order_by(desc(OpportunityQuestion.upvotes))
    elif sort_by == "unanswered":
        query = query.filter(OpportunityQuestion.is_answered == "No").order_by(desc(OpportunityQuestion.created_at))
    else:  # recent
        query = query.order_by(desc(OpportunityQuestion.created_at))
    
    questions = query.offset(skip).limit(limit).all()
    
    # Enrich with user data and answer count
    result = []
    for q in questions:
        q_dict = q.__dict__
        user = db.query(UserProfile).filter(UserProfile.id == q.user_id).first()
        answer_count = db.query(func.count(OpportunityAnswer.id)).filter(
            OpportunityAnswer.question_id == q.id
        ).scalar()
        
        if user:
            q_dict['user_name'] = user.name
        q_dict['answer_count'] = answer_count
        
        result.append(QuestionResponse(**q_dict))
    
    return result


@router.get("/questions/{question_id}", response_model=QuestionWithAnswers)
def get_question_with_answers(question_id: UUID, db: Session = Depends(get_db)):
    """Get a question with all its answers"""
    question = db.query(OpportunityQuestion).filter(OpportunityQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Increment view count
    question.views += 1
    db.commit()
    
    # Get answers
    answers = db.query(OpportunityAnswer).filter(
        OpportunityAnswer.question_id == question_id
    ).order_by(desc(OpportunityAnswer.is_accepted), desc(OpportunityAnswer.upvotes)).all()
    
    # Enrich question
    q_dict = question.__dict__
    user = db.query(UserProfile).filter(UserProfile.id == question.user_id).first()
    if user:
        q_dict['user_name'] = user.name
    q_dict['answer_count'] = len(answers)
    
    # Enrich answers
    answer_list = []
    for ans in answers:
        ans_dict = ans.__dict__
        ans_user = db.query(UserProfile).filter(UserProfile.id == ans.user_id).first()
        if ans_user:
            ans_dict['user_name'] = ans_user.name
            ans_dict['user_reputation'] = ans_user.reputation_score
        answer_list.append(AnswerResponse(**ans_dict))
    
    q_dict['answers'] = answer_list
    
    return QuestionWithAnswers(**q_dict)


@router.post("/questions/", response_model=QuestionResponse)
def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    """Create a new question"""
    # Verify opportunity exists
    opp = db.query(Opportunity).filter(Opportunity.id == question.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    new_question = OpportunityQuestion(**question.dict())
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return QuestionResponse(**new_question.__dict__)


@router.post("/answers/", response_model=AnswerResponse)
def create_answer(answer: AnswerCreate, db: Session = Depends(get_db)):
    """Create a new answer"""
    # Verify question exists
    question = db.query(OpportunityQuestion).filter(
        OpportunityQuestion.id == answer.question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    new_answer = OpportunityAnswer(**answer.dict())
    db.add(new_answer)
    
    # Mark question as answered
    question.is_answered = "Yes"
    
    # Update user reputation
    user = db.query(UserProfile).filter(UserProfile.id == answer.user_id).first()
    if user:
        user.reputation_score += 10
    
    db.commit()
    db.refresh(new_answer)
    
    return AnswerResponse(**new_answer.__dict__)


@router.post("/answers/{answer_id}/accept")
def accept_answer(answer_id: UUID, db: Session = Depends(get_db)):
    """Mark an answer as accepted"""
    answer = db.query(OpportunityAnswer).filter(OpportunityAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Unmark other answers for this question
    db.query(OpportunityAnswer).filter(
        OpportunityAnswer.question_id == answer.question_id,
        OpportunityAnswer.id != answer_id
    ).update({"is_accepted": "No"})
    
    # Mark this answer as accepted
    answer.is_accepted = "Yes"
    
    # Bonus reputation
    user = db.query(UserProfile).filter(UserProfile.id == answer.user_id).first()
    if user:
        user.reputation_score += 25
    
    db.commit()
    
    return {"message": "Answer marked as accepted"}


# ============================================================================
# MENTORSHIP ENDPOINTS
# ============================================================================

@router.get("/mentors/", response_model=List[MentorProfileResponse])
def get_mentors(
    expertise: Optional[str] = None,
    availability: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get list of mentors"""
    query = db.query(MentorProfile)
    
    if availability:
        query = query.filter(MentorProfile.availability == availability)
    
    mentors = query.order_by(desc(MentorProfile.rating)).offset(skip).limit(limit).all()
    
    # Filter by expertise if provided
    if expertise:
        mentors = [m for m in mentors if m.expertise_areas and expertise.lower() in [e.lower() for e in m.expertise_areas]]
    
    # Enrich with user data
    result = []
    for mentor in mentors:
        mentor_dict = mentor.__dict__
        user = db.query(UserProfile).filter(UserProfile.id == mentor.user_id).first()
        if user:
            mentor_dict['user_name'] = user.name
            mentor_dict['user_university'] = user.university
            mentor_dict['user_academic_status'] = user.academic_status
        result.append(MentorProfileResponse(**mentor_dict))
    
    return result


@router.get("/mentors/{mentor_id}", response_model=MentorProfileResponse)
def get_mentor(mentor_id: UUID, db: Session = Depends(get_db)):
    """Get a single mentor profile"""
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    mentor_dict = mentor.__dict__
    user = db.query(UserProfile).filter(UserProfile.id == mentor.user_id).first()
    if user:
        mentor_dict['user_name'] = user.name
        mentor_dict['user_university'] = user.university
        mentor_dict['user_academic_status'] = user.academic_status
    
    return MentorProfileResponse(**mentor_dict)


@router.post("/mentors/", response_model=MentorProfileResponse)
def create_mentor_profile(mentor: MentorProfileCreate, db: Session = Depends(get_db)):
    """Create or update mentor profile"""
    # Check if mentor profile already exists
    existing = db.query(MentorProfile).filter(MentorProfile.user_id == mentor.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mentor profile already exists")
    
    new_mentor = MentorProfile(**mentor.dict())
    db.add(new_mentor)
    db.commit()
    db.refresh(new_mentor)
    
    return MentorProfileResponse(**new_mentor.__dict__)


@router.put("/mentors/{mentor_id}", response_model=MentorProfileResponse)
def update_mentor_profile(
    mentor_id: UUID,
    mentor_update: MentorProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update mentor profile"""
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    update_data = mentor_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mentor, key, value)
    
    db.commit()
    db.refresh(mentor)
    
    return MentorProfileResponse(**mentor.__dict__)


@router.post("/mentorship/requests/", response_model=MentorshipRequestResponse)
def create_mentorship_request(request: MentorshipRequestCreate, db: Session = Depends(get_db)):
    """Create a mentorship request"""
    # Verify mentor exists
    mentor = db.query(MentorProfile).filter(MentorProfile.id == request.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    new_request = MentorshipRequest(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return MentorshipRequestResponse(**new_request.__dict__)


@router.put("/mentorship/requests/{request_id}", response_model=MentorshipRequestResponse)
def update_mentorship_request(
    request_id: UUID,
    request_update: MentorshipRequestUpdate,
    db: Session = Depends(get_db)
):
    """Update mentorship request (accept, complete, rate)"""
    request = db.query(MentorshipRequest).filter(MentorshipRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Mentorship request not found")
    
    update_data = request_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(request, key, value)
    
    # If completed, update mentor stats
    if update_data.get('status') == 'Completed':
        request.completed_at = datetime.utcnow()
        mentor = db.query(MentorProfile).filter(MentorProfile.id == request.mentor_id).first()
        if mentor:
            mentor.total_sessions += 1
            
            # Update rating if provided
            if update_data.get('rating'):
                current_total = mentor.rating * (mentor.total_sessions - 1)
                new_rating = int((current_total + update_data['rating'] * 10) / mentor.total_sessions)
                mentor.rating = new_rating
    
    db.commit()
    db.refresh(request)
    
    return MentorshipRequestResponse(**request.__dict__)


# ============================================================================
# APPLICATION TIPS ENDPOINTS
# ============================================================================

@router.get("/tips/", response_model=List[ApplicationTipResponse])
def get_tips(
    opportunity_id: Optional[UUID] = None,
    category: Optional[str] = None,
    featured_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get application tips"""
    query = db.query(ApplicationTip)
    
    if opportunity_id:
        query = query.filter(ApplicationTip.opportunity_id == opportunity_id)
    
    if category:
        query = query.filter(or_(
            ApplicationTip.category_type == "General",
            ApplicationTip.tip_category == category
        ))
    
    if featured_only:
        query = query.filter(ApplicationTip.is_featured == "Yes")
    
    tips = query.order_by(desc(ApplicationTip.upvotes)).offset(skip).limit(limit).all()
    
    # Enrich with author data
    result = []
    for tip in tips:
        tip_dict = tip.__dict__
        if tip.author_id:
            author = db.query(UserProfile).filter(UserProfile.id == tip.author_id).first()
            if author:
                tip_dict['author_name'] = author.name
        if tip.opportunity_id:
            opp = db.query(Opportunity).filter(Opportunity.id == tip.opportunity_id).first()
            if opp:
                tip_dict['opportunity_title'] = opp.title
        result.append(ApplicationTipResponse(**tip_dict))
    
    return result


@router.post("/tips/", response_model=ApplicationTipResponse)
def create_tip(tip: ApplicationTipCreate, db: Session = Depends(get_db)):
    """Create a new application tip"""
    new_tip = ApplicationTip(**tip.dict())
    db.add(new_tip)
    
    # Update user reputation
    user = db.query(UserProfile).filter(UserProfile.id == tip.author_id).first()
    if user:
        user.reputation_score += 5
    
    db.commit()
    db.refresh(new_tip)
    
    return ApplicationTipResponse(**new_tip.__dict__)


# ============================================================================
# VOTING ENDPOINTS
# ============================================================================

@router.post("/vote/")
def vote(vote_data: VoteCreate, db: Session = Depends(get_db)):
    """Upvote content (success story, question, answer, or tip)"""
    # Check if already voted
    existing = db.query(CommunityVote).filter(
        CommunityVote.user_id == vote_data.user_id,
        CommunityVote.votable_type == vote_data.votable_type,
        CommunityVote.votable_id == vote_data.votable_id
    ).first()
    
    if existing:
        # Remove vote (toggle)
        db.delete(existing)
        increment = -1
    else:
        # Add vote
        new_vote = CommunityVote(**vote_data.dict())
        db.add(new_vote)
        increment = 1
    
    # Update upvote count on the target
    model_map = {
        "SuccessStory": SuccessStory,
        "Question": OpportunityQuestion,
        "Answer": OpportunityAnswer,
        "Tip": ApplicationTip
    }
    
    target_model = model_map.get(vote_data.votable_type)
    if target_model:
        target = db.query(target_model).filter(target_model.id == vote_data.votable_id).first()
        if target:
            target.upvotes += increment
            
            # Bonus reputation for content author
            if hasattr(target, 'user_id'):
                user = db.query(UserProfile).filter(UserProfile.id == target.user_id).first()
                if user:
                    user.reputation_score += (2 * increment)
            elif hasattr(target, 'author_id') and target.author_id:
                user = db.query(UserProfile).filter(UserProfile.id == target.author_id).first()
                if user:
                    user.reputation_score += (2 * increment)
    
    db.commit()
    
    return {"message": "Vote recorded", "action": "added" if increment > 0 else "removed"}


# ============================================================================
# STATS ENDPOINT
# ============================================================================

@router.get("/stats/", response_model=CommunityStats)
def get_community_stats(db: Session = Depends(get_db)):
    """Get community statistics"""
    return CommunityStats(
        total_stories=db.query(func.count(SuccessStory.id)).scalar(),
        total_questions=db.query(func.count(OpportunityQuestion.id)).scalar(),
        total_answers=db.query(func.count(OpportunityAnswer.id)).scalar(),
        total_mentors=db.query(func.count(MentorProfile.id)).scalar(),
        total_tips=db.query(func.count(ApplicationTip.id)).scalar(),
        active_users=db.query(func.count(UserProfile.id)).filter(
            UserProfile.reputation_score > 0
        ).scalar()
    )
