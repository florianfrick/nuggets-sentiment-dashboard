# nuggets-sentiment-dashboard
 This full-stack project is an analytics dashboard for the Denver Nuggets that scrapes r/DenverNuggets Reddit threads, performs sentiment analysis using Gemini, and visualizes the data against boxscore performance to track season trends.


**Technical Architecture**
- Frontend: React, Vite, TailwindCSS, and Recharts for high-performance data visualization.
- API Layer: AWS AppSync (GraphQL) for real-time data fetching and subscription capabilities.
- Database: AWS DynamoDB designed with single-table architecture for efficient querying of time-series data.
- Backend Processing: Automated Python scripts to scrape Reddit and call Gemini's Gemma 3 27B model for one-shot sentiment analysis.
- Agentic AI Chat: Websocket connection between users and an AWS Lambda which performs RAG (retrieval augmented generation) with the Gemma 4 31B model.

**Agentic RAG Chat Feature**
- This feature allows users to ask complex questions that are answered by combining real-time data retrieval with generative AI capabilities.
- Includes conversation history and context-aware responses, making it possible to have a dynamic dialogue about Nuggets performance and fan sentiment trends.
- Shows thought process and tool calls for transparency, allowing users to understand how the AI arrived at its conclusions.