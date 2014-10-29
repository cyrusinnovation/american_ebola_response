require 'csv'
require 'date'

# Field order is:
# URL, Source, Title, Description, Date
class NewsData 
	attr_accessor :news, :headers

	URL_FIELD = 0
	SOURCE_FIELD = 1
	TITLE_FIELD = 2
	DESCRIPTION_FIELD = 3
	DATE_FIELD = 4

	def initialize()
		@news = {}

		row_index = 0;
		CSV.foreach('inputs/outbreak_news.csv') do |row|
			parse_line(row) unless row_index == 0
			row_index = row_index + 1
		end
	end

	def date(date_field)
		data = date_field.split('/')
		"#{data[2]}-#{data[0].rjust(2,'0')}-#{data[1].rjust(2,'0')}"
	end

	def parse_line(line)
		fields = line
		news_date = date(fields[DATE_FIELD])
		@news[news_date] = { url: fields[URL_FIELD], source: fields[SOURCE_FIELD], title: fields[TITLE_FIELD], 
			description: fields[DESCRIPTION_FIELD] };
	end
end